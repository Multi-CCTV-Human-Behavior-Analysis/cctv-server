package com.knu.capstone2.service;

import com.knu.capstone2.domain.EventHistory;
import com.knu.capstone2.dto.AddEventHistoryRequest;
import com.knu.capstone2.repository.EventHistoryRepository;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class EventService {
    @Autowired
    private EventHistoryRepository eventHistoryRepository;

    public List<EventHistory> getEvents(String eventType, LocalDate startDate, LocalDate endDate) {
        List<EventHistory> allEvents = eventHistoryRepository.findAll();

        return allEvents.stream()
                .filter(e -> {
                    // eventType 필터
                    if (eventType != null && !eventType.equalsIgnoreCase("ALL")) {
                        if (!e.getEventType().equalsIgnoreCase(eventType)) {
                            return false;
                        }
                    }
                    // startDate 필터
                    if (startDate != null && e.getTimestamp().toLocalDate().isBefore(startDate)) {
                        return false;
                    }
                    // endDate 필터
                    if (endDate != null && e.getTimestamp().toLocalDate().isAfter(endDate)) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());
    }

    public EventHistory findById(Long id) {
        return eventHistoryRepository.findById(id).orElse(null);
    }

    public Long addEvent(AddEventHistoryRequest request) {
        EventHistory eventHistory = EventHistory.builder()
                .eventType(request.eventType())
                .timestamp(request.timestamp())
                .detail(request.detail())
                .cameraId(request.cameraId())
                .clipStartTime(request.clipStartTime())
                .clipEndTime(request.clipEndTime())
                .build();

        eventHistoryRepository.save(eventHistory);
        return eventHistory.getId();
    }
}
