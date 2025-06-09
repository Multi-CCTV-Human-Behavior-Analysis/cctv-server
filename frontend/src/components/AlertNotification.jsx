import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Fade, Chip } from '@mui/material';
import { NotificationsActive, Warning, Error, Info } from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client } from '@stomp/stompjs';

const AlertNotification = () => {
    const [alert, setAlert] = useState(null);
    const [highlight, setHighlight] = useState(false);
    const audioRef = useRef(null);

    // 가장 최근 이벤트 1건만 가져오기
    useEffect(() => {
        // 가장 최근 이벤트 1건만 가져오기
        fetch('http://localhost:8081/api/history')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    const last = data[data.length - 1];
                    setAlert({
                        id: last.id,
                        type: last.eventType,
                        message: last.detail || `${last.eventType} 이벤트 발생`,
                        timestamp: last.timestamp
                    });
                } else {
                    setAlert(null);
                }
            })
            .catch(() => setAlert(null));
    }, []);

    // WebSocket 알림 오면 해당 내용으로 갱신
    useEffect(() => {
        console.log('WebSocket 연결 시도...');
        const SockJS = window.SockJS || require('sockjs-client');
        const sock = new SockJS('http://localhost:8081/ws');
        const { Client } = require('@stomp/stompjs');
        const stompClient = new Client({
            brokerURL: 'ws://localhost:8081/ws',
            connectHeaders: {},
            heartbeatIncoming: 0,
            heartbeatOutgoing: 20000,
            webSocketFactory: () => sock,
            debug: function(str) {
                console.log('STOMP: ' + str);
            },
            reconnectDelay: 5000,
            connectionTimeout: 5000
        });

        stompClient.onConnect = () => {
            console.log('WebSocket 연결 성공');
            console.log('WebSocket 구독 시작: /topic/alerts');
            stompClient.subscribe('/topic/alerts', (msg) => {
                console.log('알림 수신:', msg.body);
                if (msg.body) {
                    try {
                        const event = JSON.parse(msg.body);
                        console.log('파싱된 이벤트:', event);
                        setAlert({
                            id: Date.now(),
                            type: event.type,
                            message: `${event.type} 이벤트 발생 (확률: ${event.prob})`,
                            timestamp: new Date(event.timestamp * 1000)
                        });
                        console.log('알림 상태 업데이트 완료');
                    } catch (error) {
                        console.error('알림 파싱 에러:', error);
                        console.error('원본 메시지:', msg.body);
                    }
                }
            });
        };

        stompClient.onStompError = (frame) => {
            console.error('STOMP 에러:', frame);
            console.error('에러 메시지:', frame.headers.message);
            console.error('에러 상세:', frame.body);
        };

        stompClient.onWebSocketError = (event) => {
            console.error('WebSocket 에러:', event);
            console.error('에러 타입:', event.type);
            console.error('에러 타겟:', event.target);
        };

        stompClient.activate();
        return () => {
            console.log('WebSocket 연결 해제');
            stompClient.deactivate();
        };
    }, []);

    useEffect(() => {
        if (alert) {
            // 하이라이트 효과
            setHighlight(true);
            // 알림음 재생
            if (audioRef.current) {
                audioRef.current.play().catch(error => {
                    console.log('알림음 재생 실패:', error);
                });
            }
            // 1.2초 후 하이라이트 효과 제거
            const timer = setTimeout(() => setHighlight(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [alert]);

    useEffect(() => {
        const unlockAudio = () => {
            if (audioRef.current) {
                audioRef.current.play().catch(() => {});
            }
            window.removeEventListener('click', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    const getAlertIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'fall':
                return <Error sx={{ color: '#ff5b56', animation: highlight ? 'pulse 1s infinite' : 'none' }} />;
            case 'reverse_driving':
                return <Warning sx={{ color: '#ffb300', animation: highlight ? 'pulse 1s infinite' : 'none' }} />;
            case 'thief':
                return <Error sx={{ color: '#3182f6', animation: highlight ? 'pulse 1s infinite' : 'none' }} />;
            default:
                return <Info sx={{ color: '#3182f6', animation: highlight ? 'pulse 1s infinite' : 'none' }} />;
        }
    };

    const getTypeChip = (type) => {
        switch (type?.toLowerCase()) {
            case 'fall':
                return <Chip label="넘어짐" color="error" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5, mr: 1 }} />;
            case 'reverse_driving':
                return <Chip label="역주행" color="warning" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5, mr: 1 }} />;
            case 'thief':
                return <Chip label="침입" color="secondary" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5, mr: 1 }} />;
            default:
                return <Chip label={type} color="primary" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5, mr: 1 }} />;
        }
    };

    // 확률(%) 추출 함수
    const getProbPercent = (prob) => {
        if (typeof prob === 'number') {
            return `${Math.round(prob * 100)}%`;
        }
        // 메시지에 '확률:'이 포함된 경우 추출
        if (typeof prob === 'string' && prob.includes('확률:')) {
            const match = prob.match(/확률: ?([0-9.]+)/);
            if (match) return `${Math.round(Number(match[1]) * 100)}%`;
        }
        return null;
    };

    return (
        <Paper sx={{ 
            p: 3, 
            borderRadius: 3, 
            boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', 
            background: '#fff', 
            minHeight: 120,
            transition: 'all 0.3s ease',
            transform: highlight ? 'scale(1.02)' : 'scale(1)',
            border: highlight ? '2px solid #3182f6' : 'none'
        }}>
            <style>
                {`
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.2); }
                        100% { transform: scale(1); }
                    }
                `}
            </style>
            <audio ref={audioRef} src="/alert.mp3" preload="auto" />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive sx={{ 
                    color: '#3182f6',
                    animation: highlight ? 'pulse 1s infinite' : 'none'
                }} />
                <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, color: '#222' }}>
                    실시간 알림
                </Typography>
            </Box>
            {alert ? (
                <Fade in={highlight} timeout={600}>
                    <List>
                        <ListItem sx={{ 
                            bgcolor: highlight ? '#e8f1fd' : 'inherit', 
                            borderRadius: 2, 
                            transition: 'all 0.3s ease',
                            transform: highlight ? 'translateX(10px)' : 'translateX(0)'
                        }}>
                            <ListItemIcon>{getAlertIcon(alert.type)}</ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getTypeChip(alert.type)}
                                        <Typography component="span" sx={{ 
                                            fontWeight: 700, 
                                            color: '#222', 
                                            fontSize: 18, 
                                            mr: 1,
                                            animation: highlight ? 'pulse 1s infinite' : 'none'
                                        }}>
                                            {alert.type ? (alert.type === 'fall' ? '넘어짐' : alert.type === 'reverse_driving' ? '역주행' : alert.type) : ''}
                                        </Typography>
                                        {alert.prob !== undefined && (
                                            <Chip 
                                                label={`확률: ${getProbPercent(alert.prob)}`} 
                                                color="info" 
                                                size="small" 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    fontSize: 14, 
                                                    ml: 1,
                                                    animation: highlight ? 'pulse 1s infinite' : 'none'
                                                }} 
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={format(new Date(alert.timestamp), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                            />
                        </ListItem>
                    </List>
                </Fade>
            ) : (
                <Typography color="text.secondary">최근 알림이 없습니다.</Typography>
            )}
        </Paper>
    );
};

export default AlertNotification; 