import React from 'react';
import { Typography, List, ListItem, ListItemText, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { CAMERAS } from '../constants/cameras';
import { useState, useEffect } from 'react';

function SettingsPage() {
    // 주기 삭제 관련 상태
    const [deletePeriod, setDeletePeriod] = useState(() => localStorage.getItem('deletePeriod') || '7');
    const [savedPeriod, setSavedPeriod] = useState(deletePeriod);
    const handleChange = (e) => setDeletePeriod(e.target.value);
    const handleApply = () => {
        localStorage.setItem('deletePeriod', deletePeriod);
        setSavedPeriod(deletePeriod);
    };
    useEffect(() => {
        setDeletePeriod(localStorage.getItem('deletePeriod') || '7');
        setSavedPeriod(localStorage.getItem('deletePeriod') || '7');
    }, []);

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
            {/* 영상 주기 삭제 설정 */}
            <Box sx={{ mt: 5, p: 3, border: '1px solid #eee', borderRadius: 2, maxWidth: 400 }}>
                <Typography variant="h6" gutterBottom>영상 주기 삭제</Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="delete-period-label">삭제 주기(일)</InputLabel>
                    <Select
                        labelId="delete-period-label"
                        value={deletePeriod}
                        label="삭제 주기(일)"
                        onChange={handleChange}
                    >
                        <MenuItem value={"1"}>1일</MenuItem>
                        <MenuItem value={"3"}>3일</MenuItem>
                        <MenuItem value={"7"}>7일</MenuItem>
                        <MenuItem value={"30"}>30일</MenuItem>
                    </Select>
                </FormControl>
                <Button variant="contained" onClick={handleApply} disabled={deletePeriod === savedPeriod}>적용</Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    현재 설정: {savedPeriod}일마다 영상 자동 삭제
                </Typography>
            </Box>
        </div>
    );
}

export default SettingsPage;
