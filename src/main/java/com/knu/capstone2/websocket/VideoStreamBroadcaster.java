package com.knu.capstone2.websocket;

import java.nio.ByteBuffer;
import java.util.Collections;
import java.util.Iterator;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class VideoStreamBroadcaster {

    private final Set<WebSocketSession> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private byte[] initSegment; // 초기화 세그먼트 저장

    public void addSession(WebSocketSession session) {
        sessions.add(session);
        System.out.println("🟢 addSession(): " + session.getId() + ", total=" + sessions.size());

        // 초기화 세그먼트가 있고 세션이 열려있는 경우
        if (initSegment != null && session.isOpen()) {
            try {
                Thread.sleep(100);

                // 동기적으로 초기화 세그먼트 전송
                ByteBuffer buffer = ByteBuffer.allocate(initSegment.length + 1);
                buffer.put((byte) 0);
                buffer.put(initSegment);
                buffer.flip();
                session.sendMessage(new BinaryMessage(buffer));
            } catch (IOException | InterruptedException e) {
                System.err.println("초기화 세그먼트 전송 에러: " + session.getId());
                e.printStackTrace();
                removeSession(session);
            }
        }
    }

    public void removeSession(WebSocketSession session) {
        sessions.remove(session);
    }

    public void broadcastInitSegment(byte[] data) {
        this.initSegment = data; // 초기화 세그먼트 저장

        // 초기화 세그먼트 전송 시 특별한 헤더 추가
        ByteBuffer buffer = ByteBuffer.allocate(data.length + 1);
        buffer.put((byte) 0); // 0: 초기화 세그먼트 표시
        buffer.put(data);
        buffer.flip();

        broadcast(new BinaryMessage(buffer));
    }

    public void broadcastMediaSegment(byte[] data) {
        // 미디어 세그먼트 전송 시 특별한 헤더 추가
        ByteBuffer buffer = ByteBuffer.allocate(data.length + 1);
        buffer.put((byte) 1); // 1: 미디어 세그먼트 표시
        buffer.put(data);
        buffer.flip();

        broadcast(new BinaryMessage(buffer));
    }

    private void broadcast(BinaryMessage message) {
        Iterator<WebSocketSession> iterator = sessions.iterator();
        while (iterator.hasNext()) {
            WebSocketSession session = iterator.next();
            try {
                if (session.isOpen()) {
                    session.setTextMessageSizeLimit(512000);
                    session.setBinaryMessageSizeLimit(512000);
                    session.sendMessage(message);
                } else {
                    iterator.remove();
                }
            } catch (IOException e) {
                System.err.println("WebSocket 전송 에러: " + session.getId());
                iterator.remove();
            }
        }
    }
}