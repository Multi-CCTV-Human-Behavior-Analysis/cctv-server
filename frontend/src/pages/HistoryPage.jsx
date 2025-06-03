import React, { useState, useEffect } from 'react';
import {
    Typography, Paper, TextField, Button,
    MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Grid, TablePagination
} from '@mui/material';

function HistoryPage() {
    // 필터 상태
    const [eventType, setEventType] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [history, setHistory] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

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
        setPage(0); // 필터 적용 시 첫 페이지로 이동
    };

    // 페이지네이션 관련 핸들러
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // 현재 페이지에 보여줄 데이터
    const pagedHistory = history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', background: '#fff', mt: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#222', mb: 3 }}>이력</Typography>
            {/* 필터 영역 */}
            <Grid container spacing={2} sx={{ mb: 3, p: 2, borderRadius: 2, background: '#f5f7fa', boxShadow: '0 1px 6px 0 rgba(49,130,246,0.04)' }}>
                <Grid item xs={12} sm={4} md={3}>
                    <FormControl fullWidth>
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
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    <TextField
                        label="시작 날짜"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                    <TextField
                        label="종료 날짜"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                    />
                </Grid>
                <Grid item xs={12} sm={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button variant="contained" onClick={handleFilter} sx={{ height: 56, fontWeight: 700, fontSize: 16, borderRadius: 2, boxShadow: 'none' }}>
                        필터 적용
                    </Button>
                </Grid>
            </Grid>
            {/* 결과 테이블 */}
            <TableContainer sx={{ borderRadius: 2, boxShadow: '0 1px 6px 0 rgba(49,130,246,0.04)' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ background: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>이상행동 유형</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>설명</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>발생 시간</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagedHistory.map((event) => (
                            <TableRow key={event.id} hover sx={{ transition: 'background 0.2s', '&:hover': { background: '#e8f1fd' } }}>
                                <TableCell>{event.id}</TableCell>
                                <TableCell>{event.eventType}</TableCell>
                                <TableCell>{event.description}</TableCell>
                                {/* 시간 형식 포맷팅은 적절히 처리 */}
                                <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={history.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="페이지당 행 수"
            />
        </Paper>
    );
}

export default HistoryPage;
