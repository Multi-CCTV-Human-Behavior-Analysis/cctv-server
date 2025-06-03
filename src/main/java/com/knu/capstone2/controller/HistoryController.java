package com.knu.capstone2.controller;

import com.knu.capstone2.domain.EventHistory;
import com.knu.capstone2.dto.AddEventHistoryRequest;
import com.knu.capstone2.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@Slf4j
@RestController
@RequestMapping("/api/history")
@Tag(name = "Event History", description = "이벤트 히스토리 관리 API")
public class HistoryController {
    @Autowired
    private EventService eventService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Operation(summary = "이벤트 히스토리 조회", description = "필터링 조건에 따라 이벤트 히스토리를 조회합니다.")
    @GetMapping
    public List<EventHistory> getHistory(
            @Parameter(description = "이벤트 타입", example = "FALL")
            @RequestParam(required = false) String eventType,
            @Parameter(description = "필터 시작 날짜", example = "2024-01-01")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @Parameter(description = "필터 종료 날짜", example = "2024-12-31")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        // eventType, startDate, endDate가 null이 아닐 경우 필터 적용
        return eventService.getEvents(eventType, startDate, endDate);
    }

    // 단순 이벤트만 저장 (클립 x)
    @Operation(summary = "이벤트 추가", description = "새로운 이벤트를 추가합니다. (클립 생성x)")
    @PostMapping
    public void addHistory(@RequestBody AddEventHistoryRequest request) {
        eventService.addEvent(request);
    }

    // 파이썬 Flask에서 이상행동 이벤트를 수신하는 엔드포인트
    @PostMapping("/event")
    public void receiveEvent(@RequestBody EventRequest eventRequest) {
        // EventHistory 저장
        AddEventHistoryRequest req = new AddEventHistoryRequest(
            eventRequest.getType(),
            java.time.LocalDateTime.now(),
            "이상행동 감지: " + eventRequest.getType() + ", 확률: " + eventRequest.getProb(),
            null, // cameraId
            null, // clipStartTime
            null  // clipEndTime
        );
        eventService.addEvent(req);
        // WebSocket 알림 전송
        messagingTemplate.convertAndSend("/topic/alerts", eventRequest);
    }

    // 이벤트 요청 DTO
    public static class EventRequest {
        private String type;
        private double prob;
        private double timestamp;
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public double getProb() { return prob; }
        public void setProb(double prob) { this.prob = prob; }
        public double getTimestamp() { return timestamp; }
        public void setTimestamp(double timestamp) { this.timestamp = timestamp; }
    }
}
