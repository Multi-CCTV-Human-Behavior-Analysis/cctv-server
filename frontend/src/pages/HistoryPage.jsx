import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, TextField, Button,
    MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import Layout from '../Layout';

function HistoryPage() {
    const [eventType, setEventType] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [history, setHistory] = useState([]);
    const [selectedClipId, setSelectedClipId] = useState(null);

    const loadHistory = () => {
        const params = new URLSearchParams();
        if (eventType !== 'ALL') params.append('eventType', eventType);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        fetch(`http://localhost:8080/api/history?${params.toString()}`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleFilter = () => {
        loadHistory();
    };

    return (
        <Layout>
            <Typography variant="h4" gutterBottom>History</Typography>

            <Paper sx={{ p: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 120, mr: 2 }}>
                    <InputLabel>이상행동 유형</InputLabel>
                    <Select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                        <MenuItem value="ALL">ALL</MenuItem>
                        <MenuItem value="FALL">FALL</MenuItem>
                        <MenuItem value="REVERSE">REVERSE</MenuItem>
                    </Select>
                </FormControl>

                <TextField label="시작 날짜" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} sx={{ mr: 2 }} InputLabelProps={{ shrink: true }} />
                <TextField label="종료 날짜" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} sx={{ mr: 2 }} InputLabelProps={{ shrink: true }} />
                <Button variant="contained" onClick={handleFilter}>필터 적용</Button>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>이상행동 유형</TableCell>
                            <TableCell>설명</TableCell>
                            <TableCell>발생 시간</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {history.map((event) => (
                            <TableRow key={event.id} hover onClick={() => setSelectedClipId(event.id)}>
                                <TableCell>{event.id}</TableCell>
                                <TableCell>{event.eventType}</TableCell>
                                <TableCell>{event.description}</TableCell>
                                <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedClipId && (
                <Paper sx={{ p: 2, mt: 2 }}>
                    <Typography>선택한 이벤트 클립 재생</Typography>
                    <video controls style={{ width: '100%' }}>
                        <source src={`http://localhost:8080/api/clip/${selectedClipId}`} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </Paper>
            )}
        </Layout>
    );
}

export default HistoryPage;
