import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';
import { CAMERAS } from '../constants/cameras';

function SettingsPage() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>카메라 설정</Typography>
            <Typography variant="subtitle1" gutterBottom>현재 시스템에 등록된 카메라 목록</Typography>
            <List>
                {CAMERAS.map(cam => (
                    <ListItem key={cam.id}>
                        <ListItemText primary={cam.name} secondary={cam.rtsp} />
                    </ListItem>
                ))}
            </List>
        </div>
    );
}

export default SettingsPage;
