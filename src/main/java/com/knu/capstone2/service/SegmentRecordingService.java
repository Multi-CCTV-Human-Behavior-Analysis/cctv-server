package com.knu.capstone2.service;

import com.knu.capstone2.websocket.VideoStreamBroadcaster;
import jakarta.annotation.PreDestroy;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Random;
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
    private final Random random = new Random();

    /**
     * 애플리케이션 가동 후 한번만 호출되어,
     * ▶ ffmpeg 로 세그먼트(1분간격 녹화) + 실시간 스트리밍(fMP4)을 동시에 시작합니다.
     * (nvr에서 하나의 연결만 지원해서 두 기능을 하나의 함수로 합침)
     * @throws IOException
     */
    @EventListener(ApplicationReadyEvent.class)
    public void startSegmentRecording() {
        try {
            System.out.println("웹캠 스트리밍 시작");
            List<String> cmd = List.of(
                    "ffmpeg",
                    "-f", "avfoundation",  // macOS용 웹캠 캡처
                    "-framerate", "30",
                    "-video_size", "1280x720",
                    "-i", "0:0",  // 첫 번째 웹캠 사용
                    "-c:v", "libx264",
                    "-preset", "ultrafast",
                    "-tune", "zerolatency",
                    "-f", "mp4",
                    "-movflags", "frag_keyframe+empty_moov+default_base_moof",
                    "pipe:1"
            );
            System.out.println("▶ FFmpeg 시작: " + String.join(" ", cmd));

            ProcessBuilder pb = new ProcessBuilder(cmd);
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);
            pb.redirectOutput(ProcessBuilder.Redirect.PIPE);
            ffmpegProcess = pb.start();

            Thread streamer = new Thread(this::streamFragmentedMP4, "mp4-streamer");
            streamer.setDaemon(true);
            streamer.start();
        } catch (IOException e) {
            System.err.println("❌ 웹캠 스트리밍 시작 실패");
            e.printStackTrace();
        }
    }

    private void streamFragmentedMP4() {
        try (InputStream is = ffmpegProcess.getInputStream()) {
            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            byte[] chunk = new byte[8 * 1024];
            int read;

            byte[] initSegment = null;
            boolean isInitSegmentSent = false;

            while ((read = is.read(chunk)) != -1) {
                buffer.write(chunk, 0, read);
                byte[] data = buffer.toByteArray();

                if (!isInitSegmentSent) {
                    int ftypPos = findBox(data, "ftyp", 0);
                    if (ftypPos >= 0) {
                        int moovPos = findBox(data, "moov", ftypPos + 4);
                        if (moovPos >= 0) {
                            int moovSize = getBoxSize(data, moovPos - 4);
                            int moovEnd = moovPos + moovSize - 4;

                            if (data.length >= moovEnd) {
                                initSegment = Arrays.copyOfRange(data, ftypPos - 4, moovEnd);
                                broadcaster.broadcastInitSegment(initSegment);

                                buffer.reset();
                                if (data.length > moovEnd) {
                                    buffer.write(data, moovEnd, data.length - moovEnd);
                                }

                                isInitSegmentSent = true;
                                System.out.println("초기화 세그먼트 전송 완료 (" + initSegment.length + " 바이트)");
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                }

                data = buffer.toByteArray();
                int pos = 0;

                while (pos < data.length) {
                    int moofPos = findBox(data, "moof", pos);
                    if (moofPos < 0) break;

                    int moofSize = getBoxSize(data, moofPos - 4);
                    int mdatPos = findBox(data, "mdat", moofPos + moofSize - 4);
                    if (mdatPos < 0) break;

                    int mdatSize = getBoxSize(data, mdatPos - 4);
                    int segmentEnd = mdatPos + mdatSize - 4;

                    if (data.length >= segmentEnd) {
                        byte[] mediaSegment = Arrays.copyOfRange(data, moofPos - 4, segmentEnd);
                        broadcaster.broadcastMediaSegment(mediaSegment);
                        pos = segmentEnd;
                    } else {
                        break;
                    }
                }

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