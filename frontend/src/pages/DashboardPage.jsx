import React, { useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VideocamIcon from '@mui/icons-material/Videocam';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Layout from '../Layout';
import VideoStream from '../components/VideoStream';

function DashboardPage() {
    const [abnormalCount, setAbnormalCount] = useState(12);
    const [cameraCount, setCameraCount] = useState(5);
    const [alertCount, setAlertCount] = useState(3);
    const [systemStatus, setSystemStatus] = useState('정상');

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Dashboard
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                    실시간 모니터링 현황
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <WarningAmberIcon sx={{ fontSize: 60, color: 'error.main' }} />
                        <Typography variant="h6">이상행동 건수</Typography>
                        <Typography variant="h4">{abnormalCount}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <VideocamIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                        <Typography variant="h6">감시 카메라 수</Typography>
                        <Typography variant="h4">{cameraCount}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                        <Typography variant="h6">경고 알림</Typography>
                        <Typography variant="h4">{alertCount}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <DashboardIcon sx={{ fontSize: 60, color: 'success.main' }} />
                        <Typography variant="h6">시스템 상태</Typography>
                        <Typography variant="h4">{systemStatus}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Box sx={{ 
                mt: 4,
                width: '70%',     // 너비를 70%로 설정
                maxWidth: '800px', // 최대 너비를 800px로 제한 (선택 사항)
                mx: 'auto',       // 좌우 마진을 auto로 설정하여 가운데 정렬
             }}>
                <Typography variant="h5" gutterBottom>
                    실시간 CCTV 영상
                </Typography>
                <VideoStream streamUrl="ws://localhost:8080/video-stream" />
            </Box>
        </>
    );
}

export default DashboardPage;
