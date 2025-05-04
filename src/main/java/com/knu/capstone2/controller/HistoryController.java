package com.knu.capstone2.controller;

import com.knu.capstone2.domain.EventHistory;
import com.knu.capstone2.dto.AddEventHistoryRequest;
import com.knu.capstone2.service.EventService;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
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
public class HistoryController {
    @Autowired
    private EventService eventService;


    @GetMapping
    public List<EventHistory> getHistory(
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        // eventType, startDate, endDate가 null이 아닐 경우 필터 적용
        return eventService.getEvents(eventType, startDate, endDate);
    }



    // 단순 이벤트만 저장 (클립 x)
    @PostMapping
    public void addHistory(@RequestBody AddEventHistoryRequest request) {
        eventService.addEvent(request);
    }
}
