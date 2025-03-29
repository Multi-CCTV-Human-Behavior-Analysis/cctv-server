// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VideocamIcon from '@mui/icons-material/Videocam';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DashboardIcon from '@mui/icons-material/Dashboard';
import VideoStream from '../components/VideoStream';

function DashboardPage() {
    // 집계 데이터 예시 (실제 API 연동 시 데이터 요청 추가)
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

            {/* 집계 정보 카드 */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <WarningAmberIcon sx={{ fontSize: 60, color: 'error.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            이상행동 건수
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {abnormalCount}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <VideocamIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            감시 카메라 수
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {cameraCount}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <ReportProblemIcon sx={{ fontSize: 60, color: 'warning.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            경고 알림
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {alertCount}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <DashboardIcon sx={{ fontSize: 60, color: 'success.main' }} />
                        <Typography variant="h6" sx={{ mt: 1 }}>
                            시스템 상태
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 1 }}>
                            {systemStatus}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* VideoStream 컴포넌트를 통한 실시간 CCTV 영상 */}
            <Box sx={{ mt: 4 }}>
                <VideoStream />
            </Box>
        </>
    );
}

export default DashboardPage;
