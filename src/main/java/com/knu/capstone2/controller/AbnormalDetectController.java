package com.knu.capstone2.controller;

import com.knu.capstone2.service.AbnormalDetectService;
import com.knu.capstone2.service.EventService;
import com.knu.capstone2.dto.AddEventHistoryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/abnormal")
public class AbnormalDetectController {
    private final AbnormalDetectService abnormalDetectService;
    private final EventService eventService;

    @PostMapping("/detect")
    public Map<String, Object> detect(@RequestBody Map<String, Object> request) throws Exception {
        // 1. skeleton 데이터로 AI 분석
        Map<String, Object> aiResult = abnormalDetectService.detectAbnormal(request);

        // 2. 부가정보 추출
        String cameraId = (String) request.getOrDefault("cameraId", null);
        String detail = aiResult.get("probs") != null ? aiResult.get("probs").toString() : null;
        String eventType = (String) aiResult.getOrDefault("class", "unknown");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime clipStartTime = null;
        LocalDateTime clipEndTime = null;
        if (request.get("clipStartTime") != null) {
            clipStartTime = LocalDateTime.parse(request.get("clipStartTime").toString());
        }
        if (request.get("clipEndTime") != null) {
            clipEndTime = LocalDateTime.parse(request.get("clipEndTime").toString());
        }

        Long eventId = null;
        // 3. 이상행동이면 EventHistory에 저장 (normal이 아니면)
        if (!"normal".equalsIgnoreCase(eventType)) {
            AddEventHistoryRequest addReq = new AddEventHistoryRequest(
                    eventType,
                    now,
                    detail,
                    cameraId,
                    clipStartTime != null ? clipStartTime : now,
                    clipEndTime != null ? clipEndTime : now
            );
            eventId = eventService.addEvent(addReq);
        }

        // 4. 결과 + 저장된 이력 id 반환
        Map<String, Object> result = new HashMap<>(aiResult);
        if (eventId != null) {
            result.put("eventHistoryId", eventId);
        }
        return result;
    }
} 