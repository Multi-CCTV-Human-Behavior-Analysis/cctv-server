import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Badge } from '@mui/material';
import { NotificationsActive, Warning, Error, Info } from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client } from '@stomp/stompjs';

const AlertNotification = () => {
    const [alerts, setAlerts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const wsRef = useRef(null);

    // 이벤트 데이터 가져오기 (초기 로딩)
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/history');
                const data = await response.json();
                const newAlerts = data.map(event => ({
                    id: event.id,
                    type: event.eventType,
                    message: event.detail || `${event.eventType} 이벤트 발생`,
                    timestamp: event.timestamp,
                    read: false
                }));
                setAlerts(newAlerts);
                setUnreadCount(newAlerts.length);
            } catch (error) {
                console.error('이벤트 데이터 로딩 실패:', error);
            }
        };
        fetchEvents();
    }, []);

    // WebSocket(STOMP) 실시간 알림 구독
    useEffect(() => {
        // SockJS + STOMP 사용 (서버에 맞게 경로 조정)
        const SockJS = window.SockJS || require('sockjs-client');
        const sock = new SockJS('http://localhost:8080/ws');
        const stompClient = new Client({
            brokerURL: 'ws://localhost:8080/ws',
            connectHeaders: {},
            heartbeatIncoming: 0,
            heartbeatOutgoing: 20000,
            transport: sock
        });
        wsRef.current = stompClient;
        stompClient.onConnect = () => {
            stompClient.subscribe('/topic/alerts', (msg) => {
                if (msg.body) {
                    const event = JSON.parse(msg.body);
                    setAlerts(prev => [
                        {
                            id: Date.now(),
                            type: event.type,
                            message: `${event.type} 이벤트 발생 (확률: ${event.prob})`,
                            timestamp: new Date(event.timestamp * 1000),
                            read: false
                        },
                        ...prev
                    ]);
                    setUnreadCount(prev => prev + 1);
                }
            });
        };
        stompClient.activate();
        return () => {
            if (wsRef.current) stompClient.deactivate();
        };
    }, []);

    // 알림 읽음 처리
    const handleAlertClick = (alertId) => {
        setAlerts(prev => 
            prev.map(alert => 
                alert.id === alertId ? { ...alert, read: true } : alert
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const getAlertIcon = (type) => {
        switch (type.toLowerCase()) {
            case 'fall':
                return <Error color="error" />;
            case 'reverse_driving':
                return <Warning color="warning" />;
            case 'thief':
                return <Error color="error" />;
            default:
                return <Info color="info" />;
        }
    };

    return (
        <Paper sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsActive />
                </Badge>
                <Typography variant="h6" sx={{ ml: 1 }}>
                    실시간 알림
                </Typography>
            </Box>
            <List>
                {alerts.map((alert) => (
                    <ListItem 
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id)}
                        sx={{ 
                            cursor: 'pointer',
                            bgcolor: alert.read ? 'inherit' : 'action.hover'
                        }}
                    >
                        <ListItemIcon>
                            {getAlertIcon(alert.type)}
                        </ListItemIcon>
                        <ListItemText
                            primary={alert.message}
                            secondary={format(new Date(alert.timestamp), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default AlertNotification; 