//package com.knu.capstone2.service;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDate;
//import java.util.List;
//
//@Service
//public class EventService {
//    @Autowired
//    private EventHistoryRepository eventHistoryRepository;
//
//    public List<EventHistory> getEvents(String eventType, LocalDate startDate, LocalDate endDate) {
//        // JPA 동적 쿼리 예시 (Specification 사용) or 직접 조건문으로 필터
//        // 간단히, 모든 이력을 가져와서 필터링하는 예시:
//        List<EventHistory> allEvents = eventHistoryRepository.findAll();
//
//        return allEvents.stream()
//                .filter(e -> {
//                    // eventType 필터
//                    if (eventType != null && !eventType.equalsIgnoreCase("ALL")) {
//                        if (!e.getEventType().equalsIgnoreCase(eventType)) {
//                            return false;
//                        }
//                    }
//                    // startDate 필터
//                    if (startDate != null && e.getTimestamp().toLocalDate().isBefore(startDate)) {
//                        return false;
//                    }
//                    // endDate 필터
//                    if (endDate != null && e.getTimestamp().toLocalDate().isAfter(endDate)) {
//                        return false;
//                    }
//                    return true;
//                })
//                .collect(Collectors.toList());
//    }
//}
