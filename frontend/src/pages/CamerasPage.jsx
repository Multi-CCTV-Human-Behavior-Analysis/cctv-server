import React from 'react';
import { Grid, Typography } from '@mui/material';
import Layout from '../Layout';
import VideoStream from '../components/VideoStream';

function CamerasPage() {
    return (
        <Layout>
            <Typography variant="h4" gutterBottom>
                Cameras
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                    <VideoStream streamUrl="ws://localhost:8080/video-stream" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <VideoStream streamUrl="ws://localhost:8080/video-stream" />
                </Grid>
                <Grid item xs={12} md={4}>
                    <VideoStream streamUrl="ws://localhost:8080/video-stream" />
                </Grid>
            </Grid>
        </Layout>
    );
}

export default CamerasPage;
