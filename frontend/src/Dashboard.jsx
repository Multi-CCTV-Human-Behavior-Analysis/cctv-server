// src/DashboardPage.jsx
import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import Layout from './Layout';

function DashboardPage() {
    return (
        <Layout>
            {/* 메인 영역 */}
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
                test
            </Typography>

            {/* 상단 카드 섹션 (예: 시간, 서버상태 등) */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Time</Typography>
                        <Typography variant="body1">19:30</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Process</Typography>
                        <Typography variant="body1">10d 3m</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Status</Typography>
                        <Typography variant="body1">Aktuell</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Location</Typography>
                        <Typography variant="body1">Berlin</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* 카메라 영상 섹션 */}
            <Grid container spacing={2}>
                {/* 카메라1 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Camera 1</Typography>
                        <Box sx={{ mt: 2 }}>
                            <video width="100%" controls autoPlay>
                                <source src="http://localhost:8080/stream1" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    </Paper>
                </Grid>

                {/* 카메라2 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Keller Kamera 2</Typography>
                        <Box sx={{ mt: 2 }}>
                            <video width="100%" controls autoPlay>
                                <source src="http://localhost:8080/stream2" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    </Paper>
                </Grid>

                {/* 카메라3 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Keller Kamera 3</Typography>
                        <Box sx={{ mt: 2 }}>
                            <video width="100%" controls autoPlay>
                                <source src="http://localhost:8080/stream3" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* 하단에 CPU/메모리 사용량 등 추가 카드 배치 가능 */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">CPU 사용량</Typography>
                        <Typography variant="body1">29%</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">온도</Typography>
                        <Typography variant="body1">55°C</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">스토리지</Typography>
                        <Typography variant="body1">2.66 GB / 7.64 GB</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Layout>
    );
}

export default DashboardPage;
