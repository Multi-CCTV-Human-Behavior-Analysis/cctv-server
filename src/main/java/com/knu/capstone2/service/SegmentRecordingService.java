package com.knu.capstone2.service;

import com.knu.capstone2.websocket.VideoStreamBroadcaster;
import jakarta.annotation.PreDestroy;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SegmentRecordingService {
    @Value("${nvr.cctv.rtsp-url}")
    private String RTSP_URL;
    @Value("${segment.recording.output-dir}")
    private String OUTPUT_DIR;
    private final VideoStreamBroadcaster broadcaster;
    private Process ffmpegProcess;

    public SegmentRecordingService(VideoStreamBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    private final Path segmentsDir = Path.of("segments");
    private final Duration keepDuration = Duration.ofHours(1);

    /**
     * 애플리케이션 가동 후 한번만 호출되어,
     * ▶ ffmpeg 로 세그먼트(1분간격 녹화) + 실시간 스트리밍(fMP4)을 동시에 시작합니다.
     * (nvr에서 하나의 연결만 지원해서 두 기능을 하나의 함수로 합침)
     * @throws IOException
     */
    @EventListener(ApplicationReadyEvent.class)
    public void startSegmentRecording() {
        try {
            System.out.println("RTSP_URL = " + RTSP_URL);
            List<String> cmd = List.of(
                    "ffmpeg",

                    // 입력 최적화
                    "-rtsp_transport", "tcp",
                    "-use_wallclock_as_timestamps", "0",  // 벽시간 사용x
                    "-i", RTSP_URL,
                    "-fflags", "nobuffer",  // 버퍼링 제거
                    "-flags", "low_delay",  // 저지연 플래그
                    "-avioflags", "direct", // 직접 I/O 접근

                    // 프로세싱 옵션
                    "-probesize", "32",     // 프로브 크기 최소화
                    "-analyzeduration", "0", // 분석 시간 최소화

                    // 첫 번째 출력: 세그먼트 파일 저장
                    "-map", "0:v:0",
                    "-map", "0:a:0",
                    "-c:v", "libx264",
                    "-preset", "superfast", // preset을 superfast로 변경
                    "-c:a", "aac",
                    "-b:a", "48k",
                    "-f", "segment",
                    "-segment_time", "60",
                    "-reset_timestamps", "1",
                    "-strftime", "1",
                    "-r", "10",
                    OUTPUT_DIR + "/segment_%Y%m%d_%H%M%S.mp4",

                    // 두 번째 출력: MSE 스트리밍 (저지연 최적화)
                    "-map", "0:v:0",
                    "-map", "0:a:0",
                    "-c:v", "libx264",
                    "-c:a", "aac",
                    "-b:v", "1000k",        // 비트레이트 증가로 품질 유지
                    "-b:a", "48k",
                    "-profile:v", "baseline",
                    "-preset", "ultrafast",
                    "-tune", "zerolatency",
                    "-g", "10",             // GOP size를 프레임레이트로 설정
                    "-maxrate", "1200k",    // 최대 비트레이트 설정
                    "-bufsize", "600k",     // 버퍼 크기 설정
                    "-x264-params", "force-cfr=1", // CFR 강제
                    "-keyint_min", "10",    // 최소 키프레임 간격
                    "-r", "10",
                    "-f", "mp4",
                    "-movflags", "frag_keyframe+empty_moov+default_base_moof",
                    "pipe:1"
            );
            System.out.println("▶ FFmpeg 시작: " + String.join(" ", cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            // stderr 로그를 모두 inherit (콘솔에 찍히게)
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            pb.redirectOutput(ProcessBuilder.Redirect.PIPE);
            ffmpegProcess = pb.start();

            Thread streamer = new Thread(this::streamFragmentedMP4, "mp4-streamer");
            streamer.setDaemon(true);
            streamer.start();
        } catch (IOException e) {
            System.err.println("❌ 세그먼트 녹화 및 스트리밍 시작 실패");
            e.printStackTrace();
        }
    }

    private void streamFragmentedMP4() {
        try (InputStream is = ffmpegProcess.getInputStream()) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
//            byte[] chunk = new byte[64 * 1024]; // 더 큰 버퍼
            byte[] chunk = new byte[8 * 1024]; // 8Kb로 줄임
            int read;

            byte[] initSegment = null;
            boolean isInitSegmentSent = false;

            while ((read = is.read(chunk)) != -1) {

                buffer.write(chunk, 0, read);
                byte[] data = buffer.toByteArray();

                if (!isInitSegmentSent) {
                    // ftyp 박스 찾기
                    int ftypPos = findBox(data, "ftyp", 0);
                    if (ftypPos >= 0) {

                        // moov 박스 찾기
                        int moovPos = findBox(data, "moov", ftypPos + 4);
                        if (moovPos >= 0) {
                            int moovSize = getBoxSize(data, moovPos - 4);
                            int moovEnd = moovPos + moovSize - 4;

                            if (data.length >= moovEnd) {
                                // 초기화 세그먼트 (ftyp + moov)
                                initSegment = Arrays.copyOfRange(data, ftypPos - 4, moovEnd);
                                broadcaster.broadcastInitSegment(initSegment);

                                // 버퍼 업데이트
                                buffer.reset();
                                if (data.length > moovEnd) {
                                    buffer.write(data, moovEnd, data.length - moovEnd);
                                }

                                isInitSegmentSent = true;
                                System.out.println("초기화 세그먼트 전송 완료 (" + initSegment.length + " 바이트)");
                            } else {
                                // 더 많은 데이터 필요
                                continue;
                            }
                        } else {
                            // moov 박스를 아직 못 찾음, 더 기다림
                            continue;
                        }
                    } else {
                        // ftyp 박스를 아직 못 찾음, 더 기다림
                        continue;
                    }
                }

                // 미디어 세그먼트 처리 (moof + mdat)
                data = buffer.toByteArray();
                int pos = 0;

                while (pos < data.length) {
                    // moof 박스 찾기
                    int moofPos = findBox(data, "moof", pos);
                    if (moofPos < 0) break;

                    // moof 박스 크기 확인
                    int moofSize = getBoxSize(data, moofPos - 4);

                    // mdat 박스 찾기 (moof 다음에 와야 함)
                    int mdatPos = findBox(data, "mdat", moofPos + moofSize - 4);
                    if (mdatPos < 0) break;

                    // mdat 박스 크기 확인
                    int mdatSize = getBoxSize(data, mdatPos - 4);
                    int segmentEnd = mdatPos + mdatSize - 4;

                    // 전체 세그먼트가 버퍼에 있는지 확인
                    if (data.length >= segmentEnd) {
                        // 미디어 세그먼트 추출 (moof + mdat)
                        byte[] mediaSegment = Arrays.copyOfRange(data, moofPos - 4, segmentEnd);
                        broadcaster.broadcastMediaSegment(mediaSegment);

                        // 다음 위치로 이동
                        pos = segmentEnd;
                    } else {
                        // 세그먼트가 완전하지 않음, 더 기다림
                        break;
                    }
                }

                // 사용한 데이터 제거
                if (pos > 0) {
                    buffer.reset();
                    if (data.length > pos) {
                        buffer.write(data, pos, data.length - pos);
                    }
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // MP4 박스 찾기
    private int findBox(byte[] data, String boxType, int startPos) {
        byte[] typeBytes = boxType.getBytes();

        for (int i = startPos; i <= data.length - 4; i++) {
            boolean match = true;
            for (int j = 0; j < 4; j++) {
                if (data[i + j] != typeBytes[j]) {
                    match = false;
                    break;
                }
            }
            if (match) return i;
        }
        return -1;
    }

    // MP4 박스 크기 가져오기
    private int getBoxSize(byte[] data, int sizePos) {
        return ((data[sizePos] & 0xFF) << 24) |
                ((data[sizePos + 1] & 0xFF) << 16) |
                ((data[sizePos + 2] & 0xFF) << 8) |
                (data[sizePos + 3] & 0xFF);
    }

    /** 애플리케이션 종료 시 ffmpeg 프로세스도 정리 */
    @PreDestroy
    public void stop() {
        if (ffmpegProcess != null && ffmpegProcess.isAlive()) {
            ffmpegProcess.destroy();
        }
    }

    /** 1시간 지난 세그먼트는 주기적으로 삭제 */
    @Scheduled(fixedRateString = "PT5M")
    public void cleanOldSegments() throws IOException {
        Instant cutoff = Instant.now().minus(Duration.ofHours(1));
        var dir = java.nio.file.Path.of(OUTPUT_DIR);
        try (var stream = java.nio.file.Files.newDirectoryStream(dir, "*.mp4")) {
            for (var p : stream) {
                var ft = java.nio.file.Files.getLastModifiedTime(p).toInstant();
                if (ft.isBefore(cutoff)) {
                    java.nio.file.Files.deleteIfExists(p);
                }
            }
        }
    }
}