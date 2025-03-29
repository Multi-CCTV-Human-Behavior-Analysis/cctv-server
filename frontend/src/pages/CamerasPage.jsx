// src/pages/CamerasPage.jsx
import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';
import VideoStream from '../components/VideoStream';

function CamerasPage() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>Cameras</Typography>
            <Grid container spacing={2}>
                {/* 예시: 카메라 1 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Camera 1</Typography>
                        <VideoStream />
                    </Paper>
                </Grid>

                {/* 예시: 카메라 2 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Camera 2</Typography>
                        <VideoStream />
                    </Paper>
                </Grid>

                {/* 예시: 카메라 3 */}
                <Grid item xs={12} md={6} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Camera 3</Typography>
                        <VideoStream />
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );
}

export default CamerasPage;
