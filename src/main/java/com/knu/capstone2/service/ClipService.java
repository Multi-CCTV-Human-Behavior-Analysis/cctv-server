package com.knu.capstone2.service;

import static java.nio.charset.StandardCharsets.UTF_8;

import com.knu.capstone2.domain.EventHistory;
import com.knu.capstone2.repository.EventHistoryRepository;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@Service
public class ClipService {
    @Value("${clip.base-dir}")
    private String baseDir;
    private final Path segmentsDir = Path.of("segments");
    private static final DateTimeFormatter FILE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    @Autowired
    private EventHistoryRepository eventHistoryRepository;

    /**
     * RTSP 구간을 잘라서 서버 로컬에 MP4 파일로 저장
     * @return 저장된 파일 경로
     */
    public Path saveClipToFile(Long eventHistoryId) throws IOException, InterruptedException {
        EventHistory eventHistory = eventHistoryRepository.findById(eventHistoryId).orElse(null);
        LocalDateTime clipStart = eventHistory.getClipStartTime();
        LocalDateTime clipEnd = eventHistory.getClipEndTime();

        // 1) 모든 segment 파일(1분짜리)을 이름순으로 읽어 들이고
        List<Path> all = Files.list(segmentsDir)
                .filter(p -> p.getFileName().toString().startsWith("segment_"))
                .sorted()
                .toList();

        // 2) clipStart~clipEnd에 걸치는 파일만 골라낸다
        List<Path> needed = new ArrayList<>();
        for (Path seg : all) {
            String base = seg.getFileName().toString()
                    .replace("segment_", "")
                    .replace(".mp4", "");
            LocalDateTime segStart = LocalDateTime.parse(base, FILE_FMT);
            LocalDateTime segEnd   = segStart.plusMinutes(1);
            if (!segEnd.isBefore(clipStart) && !segStart.isAfter(clipEnd)) {
                needed.add(seg);
            }
        }
        if (needed.isEmpty()) {
            throw new IOException("해당 구간을 포함하는 세그먼트가 없습니다.");
        }

        // 3) concat demuxer용 임시 리스트 파일 생성
        Path listFile = Files.createTempFile("ffmpeg_concat_list", ".txt");
        try (BufferedWriter w = Files.newBufferedWriter(listFile, UTF_8)) {
            for (Path p : needed) {
                w.write("file '" + p.toAbsolutePath().toString().replace("'", "\\'") + "'\n");
            }
        }

        // 4) 첫 번째 세그먼트 시작 시각
        String firstBase = needed.get(0).getFileName().toString()
                .replace("segment_", "")
                .replace(".mp4", "");
        LocalDateTime firstSegStart = LocalDateTime.parse(firstBase, FILE_FMT);

        // 5) clipStart/end을 firstSegStart 기준으로 오프셋 계산
        Duration offsetStart = Duration.between(firstSegStart, clipStart);
        Duration clipLen   = Duration.between(clipStart, clipEnd);

        // 6) 출력 파일 준비
        String outName = String.format("clip_%s_%s.mp4",
                clipStart.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")),
                clipEnd  .format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss")));
        Path output = Paths.get(baseDir).resolve(outName);
        Files.createDirectories(output.getParent());

        // 7) FFmpeg 호출 (concat → trim)
        List<String> cmd = new ArrayList<>(Arrays.asList(
                "ffmpeg",
                "-y",
                "-ss", formatDuration(offsetStart),
                "-f", "concat", "-safe", "0",
                "-i", listFile.toString(),
                "-t", formatDuration(clipLen),
                "-c", "copy",
                "-movflags", "frag_keyframe+empty_moov",
                "-movflags", "faststart",
                output.toString()
        ));
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.redirectErrorStream(true);
        Process ff = pb.start();

        // (로그 필요하면 읽어 두세요)
        try (InputStream is = ff.getInputStream()) {
            is.transferTo(System.err);
        }
        if (ff.waitFor() != 0) {
            throw new IOException("FFmpeg assemble failed (exit " + ff.exitValue() + ")");
        }

        Files.deleteIfExists(listFile);

        eventHistory.setClipFilename(outName);
        eventHistoryRepository.save(eventHistory);

        return output;
    }

    private String formatDuration(Duration d) {
        long h = d.toHours();
        long m = d.minusHours(h).toMinutes();
        long s = d.minusHours(h).minusMinutes(m).getSeconds();
        return String.format("%02d:%02d:%02d", h, m, s);
    }



    /**
     * clipId 에 해당하는 파일의 실제 경로를 돌려줍니다.
     * 잘못된 ID 이거나 파일이 없으면 예외를 던집니다.
     */
    public Path getClipPath(Long clipId) throws IOException {
        EventHistory eventHistory = eventHistoryRepository.findById(clipId)
                .orElseThrow(() -> new IllegalArgumentException("no clip found for id=" + clipId));

        // 예: EventHistory 에 clipPath 라는 필드에 "clip_20250504T013626_20250504T013714.mp4" 를 저장해 두었다고 가정
        String filename = eventHistory.getClipFilename();

        Path clipsRoot = Paths.get(baseDir).toAbsolutePath().normalize();
        Path clipPath  = clipsRoot.resolve(filename).normalize();

        if (!clipPath.startsWith(clipsRoot) || !Files.exists(clipPath)) {
            throw new FileNotFoundException("no clip file found at " + clipPath);
        }

        return clipPath;
    }


    /**
     * 위 getClipPath 로 얻은 Path 를 읽어서 StreamingResponseBody 로 만들어 돌려줍니다.
     */
    public StreamingResponseBody streamClip(Long clipId) throws IOException {
        Path clipPath = getClipPath(clipId);

        return out -> {
            try (InputStream in = Files.newInputStream(clipPath)) {
                in.transferTo(out);
            }
        };
    }
}