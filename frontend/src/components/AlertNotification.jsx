import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Fade } from '@mui/material';
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
        const SockJS = window.SockJS || require('sockjs-client');
        const sock = new SockJS('http://localhost:8081/ws');
        const { Client } = require('@stomp/stompjs');
        const stompClient = new Client({
            brokerURL: 'ws://localhost:8081/ws',
            connectHeaders: {},
            heartbeatIncoming: 0,
            heartbeatOutgoing: 20000,
            webSocketFactory: () => sock
        });
        stompClient.onConnect = () => {
            stompClient.subscribe('/topic/alerts', (msg) => {
                if (msg.body) {
                    const event = JSON.parse(msg.body);
                    setAlert({
                        id: Date.now(),
                        type: event.type,
                        message: `${event.type} 이벤트 발생 (확률: ${event.prob})`,
                        timestamp: new Date(event.timestamp * 1000)
                    });
                }
            });
        };
        stompClient.activate();
        return () => stompClient.deactivate();
    }, []);

    useEffect(() => {
        if (alert) {
            setHighlight(true);
            audioRef.current && audioRef.current.play();
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
                return <Error sx={{ color: '#ff5b56' }} />;
            case 'reverse_driving':
                return <Warning sx={{ color: '#ffb300' }} />;
            case 'thief':
                return <Error sx={{ color: '#3182f6' }} />;
            default:
                return <Info sx={{ color: '#3182f6' }} />;
        }
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', background: '#fff', minHeight: 120 }}>
            <audio ref={audioRef} src="/alert.mp3" preload="auto" />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive sx={{ color: '#3182f6' }} />
                <Typography variant="h6" sx={{ ml: 1, fontWeight: 700, color: '#222' }}>
                    실시간 알림
                </Typography>
            </Box>
            {alert ? (
                <Fade in={highlight} timeout={600}>
                    <List>
                        <ListItem sx={{ bgcolor: highlight ? '#e8f1fd' : 'inherit', borderRadius: 2, transition: 'background 0.5s' }}>
                            <ListItemIcon>{getAlertIcon(alert.type)}</ListItemIcon>
                            <ListItemText
                                primary={<span style={{ fontWeight: 700, color: '#222' }}>{alert.message}</span>}
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