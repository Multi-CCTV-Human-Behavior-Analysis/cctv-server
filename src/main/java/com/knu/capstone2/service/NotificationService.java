package com.knu.capstone2.service;

import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * 시스템 상태 알림을 모든 클라이언트에게 전송합니다.
     *
     //     * @param type 알림 유형
     * @param message 알림 메시지
     */
    public void sendSystemNotification(Long eventId, LocalDateTime timestamp, String message) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("eventId", eventId);
        notification.put("timestamp", timestamp);
        notification.put("message", message);


        messagingTemplate.convertAndSend("/notice/system", notification);
    }
}