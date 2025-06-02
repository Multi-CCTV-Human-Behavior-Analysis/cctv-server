// src/pages/CamerasPage.jsx
import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';
import VideoStream from '../components/VideoStream';
import { CAMERAS } from '../constants/cameras';

function CamerasPage() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>Cameras</Typography>
            <Grid container spacing={2}>
                {CAMERAS.map(cam => (
                    <Grid item xs={12} md={6} lg={4} key={cam.id}>
                        <Paper sx={{ p: 2 }}>
                            <VideoStream rtsp={cam.rtsp} name={cam.name} />
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </div>
    );
}

export default CamerasPage;
