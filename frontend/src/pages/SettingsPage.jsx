import React from 'react';
import { Typography, Paper } from '@mui/material';

function SettingsPage() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>Settings</Typography>
            <Paper sx={{ p: 2 }}>
                <Typography>설정 화면</Typography>
            </Paper>
        </div>
    );
}

export default SettingsPage;
