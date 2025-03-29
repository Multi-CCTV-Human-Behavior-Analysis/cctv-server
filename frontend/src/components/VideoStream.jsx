// src/components/VideoStream.jsx
import React, { useState, useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function VideoStream() {
    const [imageSrc, setImageSrc] = useState('');

    useEffect(() => {
        // 백엔드에서 WebSocket 스트리밍 정보 받아오기
        fetch('http://localhost:8080/api/stream/url')
            .then(res => res.json())
            .then(data => {
                const { websocketUrl, topic } = data;
                const socket = new SockJS(websocketUrl);
                const client = new Client({
                    webSocketFactory: () => socket,
                    reconnectDelay: 5000,
                    onConnect: () => {
                        client.subscribe(topic, (message) => {
                            // 메시지가 Base64 인코딩된 JPEG 문자열이라고 가정
                            setImageSrc(`data:image/jpeg;base64,${message.body}`);
                        });
                    },
                });
                client.activate();

                // cleanup: 컴포넌트 unmount 시 deactivation
                return () => client.deactivate();
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>실시간 CCTV 영상</h2>
            {imageSrc ? (
                <img src={imageSrc} alt="CCTV Stream" style={{ width: '100%' }} />
            ) : (
                <p>영상 로딩 중...</p>
            )}
        </div>
    );
}

export default VideoStream;
