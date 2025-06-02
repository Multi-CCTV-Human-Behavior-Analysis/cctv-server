import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, TextField, Button,
    MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

function HistoryPage() {
    // 필터 상태
    const [eventType, setEventType] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 이력 목록
    const [history, setHistory] = useState([]);

    // 서버에서 이력 목록 불러오기
    const loadHistory = () => {
        // 쿼리 파라미터 구성
        const params = new URLSearchParams();
        if (eventType && eventType !== 'ALL') {
            params.append('eventType', eventType);
        }
        if (startDate) {
            params.append('startDate', startDate);
        }
        if (endDate) {
            params.append('endDate', endDate);
        }

        // 서버에 GET 요청
        fetch(`http://localhost:8081/api/history?${params.toString()}`)
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error(err));
    };

    // 페이지 로드 시 전체 이력 불러오기
    useEffect(() => {
        loadHistory();
    }, []);

    // "필터 적용" 버튼을 누르면 다시 불러오기
    const handleFilter = () => {
        loadHistory();
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>History</Typography>

            {/* 필터 영역 */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 120, mr: 2 }}>
                    <InputLabel>이상행동 유형</InputLabel>
                    <Select
                        value={eventType}
                        label="이상행동 유형"
                        onChange={(e) => setEventType(e.target.value)}
                    >
                        <MenuItem value="ALL">ALL</MenuItem>
                        <MenuItem value="FALL">FALL</MenuItem>
                        <MenuItem value="REVERSE">REVERSE</MenuItem>
                        {/* 필요한 유형을 추가로 나열 */}
                    </Select>
                </FormControl>

                <TextField
                    label="시작 날짜"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{ mr: 2 }}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="종료 날짜"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{ mr: 2 }}
                    InputLabelProps={{ shrink: true }}
                />

                <Button variant="contained" onClick={handleFilter}>
                    필터 적용
                </Button>
            </Paper>

            {/* 결과 테이블 */}
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
                            <TableRow key={event.id}>
                                <TableCell>{event.id}</TableCell>
                                <TableCell>{event.eventType}</TableCell>
                                <TableCell>{event.description}</TableCell>
                                {/* 시간 형식 포맷팅은 적절히 처리 */}
                                <TableCell>
                                    {new Date(event.timestamp).toLocaleString()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}

export default HistoryPage;
