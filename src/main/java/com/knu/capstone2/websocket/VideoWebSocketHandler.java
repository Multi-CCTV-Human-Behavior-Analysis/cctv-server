package com.knu.capstone2.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

@Component
public class VideoWebSocketHandler extends BinaryWebSocketHandler {

    private final VideoStreamBroadcaster broadcaster;


    public VideoWebSocketHandler(VideoStreamBroadcaster broadcaster) {
        this.broadcaster = broadcaster;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("WebSocket 연결 성공: " + session.getId());

        try {
            session.setTextMessageSizeLimit(1024 * 1024);
            session.setBinaryMessageSizeLimit(1024 * 1024);

            // 세션이 열려있는지 확인 후 추가
            if (session.isOpen()) {
                broadcaster.addSession(session);
            }
        } catch (Exception e) {
            System.err.println("WebSocket 설정 중 에러: " + session.getId());
            e.printStackTrace();
            if (session.isOpen()) {
                session.close();
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("WebSocket 연결 종료: " + session.getId());
        broadcaster.removeSession(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        System.err.println("WebSocket 전송 에러: " + session.getId());
        exception.printStackTrace();
        broadcaster.removeSession(session);
    }
}