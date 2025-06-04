package com.knu.capstone2.controller;

import com.knu.capstone2.dto.AddEventHistoryRequest;
import com.knu.capstone2.service.ClipService;
import com.knu.capstone2.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.CrossOrigin;
import java.io.File;
import org.springframework.web.bind.annotation.DeleteMapping;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/clip")
@Tag(name = "Clip Management", description = "비디오 클립 관리 API")
public class ClipController {
    private final ClipService clipService;
    private final EventService eventService;

    /**
        * eventHistory를 저장하면서, 해당 부분의 클립을 생성한다.
     */
    @Operation(summary = "클립 저장", description = "이벤트 히스토리를 저장하고 해당 부분의 클립을 생성합니다.")
    @PostMapping("/save")
    public ResponseEntity<Map<String,String>> saveClip(@RequestBody AddEventHistoryRequest request
    ) {
        try {
            Long id = eventService.addEvent(request);
            Path saved = clipService.saveClipToFile(id);

            return ResponseEntity.ok(Map.of(
                    "message", "클립 저장 완료",
                    "clipId", String.valueOf(id),
                    "path", saved.toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage()
            ));
        }
    }


    /**
        * 저장된 클립(mp4)을 스트리밍으로 내려준다.
     */
    @Operation(summary = "클립 조회", description = "저장된 클립(mp4)을 스트리밍으로 조회합니다.")
    @GetMapping("/{id}")
    public ResponseEntity<StreamingResponseBody> getClip(@PathVariable Long id) throws Exception {
        // 1) 파일 경로 + 크기 가져오기
        Path clipPath = clipService.getClipPath(id);
        long size = Files.size(clipPath);
        String filename = clipPath.getFileName().toString();

        // 2) StreamingResponseBody 얻기
        StreamingResponseBody body = clipService.streamClip(id);

        // 3) 헤더 붙여서 반환
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.valueOf("video/mp4"))
                .contentLength(size)
                .body(body);
    }

    /**
     * recordings 폴더 내 mp4 파일 리스트 반환
     */
    @CrossOrigin
    @GetMapping("/recordings/list")
    public ResponseEntity<List<String>> getRecordingsList() {
        try {
            File dir = new File("../frontend/public/recordings");
            if (!dir.exists() || !dir.isDirectory()) {
                return ResponseEntity.ok(List.of());
            }
            List<String> files = java.util.Arrays.stream(dir.listFiles((d, name) -> name.endsWith(".mp4")))
                    .map(File::getName)
                    .sorted((a, b) -> b.compareTo(a)) // 최신순 정렬
                    .collect(Collectors.toList());
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(List.of());
        }
    }

    /**
     * recordings 폴더 내 mp4 파일 삭제 및 recordings.json 갱신
     */
    @CrossOrigin
    @DeleteMapping("/recordings/{filename}")
    public ResponseEntity<?> deleteRecording(@PathVariable String filename) {
        try {
            clipService.deleteRecordingAndUpdateJson(filename);
            return ResponseEntity.ok(Map.of("success", true, "deleted", filename));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * 시스템 헬스 체크
     */
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}