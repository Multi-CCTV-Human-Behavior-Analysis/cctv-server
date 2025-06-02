// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VideocamIcon from '@mui/icons-material/Videocam';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideoStream from '../components/VideoStream';
import AlertNotification from '../components/AlertNotification';
import EventHistory from '../components/EventHistory';
import { CAMERAS } from '../constants/cameras';

function DashboardPage() {
    const [abnormalCount, setAbnormalCount] = useState(0);
    const [cameraCount, setCameraCount] = useState(CAMERAS.length);

    // 통계 데이터 가져오기
    useEffect(() => {
        const fetchStats = () => {
            fetch('http://localhost:8081/api/history')
                .then(res => res.json())
                .then(data => setAbnormalCount(Array.isArray(data) ? data.length : 0))
                .catch(() => setAbnormalCount(0));
        };
        fetchStats();
        const interval = setInterval(fetchStats, 3000); // 3초마다 갱신
        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            {/* 헤더 */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    CCTV 모니터링 대시보드
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    실시간 모니터링 및 이상행동 탐지 현황
                </Typography>
            </Box>

            {/* 통계 카드 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <WarningAmberIcon sx={{ fontSize: 40, color: 'error.main', mr: 1 }} />
                                <Typography variant="h6">이상행동</Typography>
                            </Box>
                            <Typography variant="h4">{abnormalCount}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                오늘 발생한 이상행동 건수
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <VideocamIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
                                <Typography variant="h6">카메라</Typography>
                            </Box>
                            <Typography variant="h4">{cameraCount}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                운영 중인 카메라 수
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <ReportProblemIcon sx={{ fontSize: 40, color: 'warning.main', mr: 1 }} />
                                <Typography variant="h6">경고</Typography>
                            </Box>
                            <Typography variant="h4">0</Typography>
                            <Typography variant="body2" color="text.secondary">
                                미처리된 경고 알림
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <DashboardIcon sx={{ fontSize: 40, color: 'success.main', mr: 1 }} />
                                <Typography variant="h6">시스템</Typography>
                            </Box>
                            <Typography variant="h4">정상</Typography>
                            <Typography variant="body2" color="text.secondary">
                                현재 시스템 상태
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* 메인 콘텐츠 */}
            <Grid container spacing={3}>
                {/* 실시간 영상 */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            실시간 CCTV 영상
                        </Typography>
                        <Grid container spacing={2}>
                            {CAMERAS.map(cam => (
                                <Grid item xs={12} md={6} key={cam.id}>
                                    <VideoStream rtsp={cam.rtsp} name={cam.name} />
                                </Grid>
                            ))}
                        </Grid>
                    </Paper>
                </Grid>

                {/* 실시간 알림 */}
                <Grid item xs={12} md={4}>
                    <AlertNotification />
                </Grid>

                {/* 이벤트 이력 */}
                <Grid item xs={12}>
                    <EventHistory />
                </Grid>
            </Grid>
        </Box>
    );
}

export default DashboardPage;
