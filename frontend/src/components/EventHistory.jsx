import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    TextField,
    MenuItem,
    Grid
} from '@mui/material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const EventHistory = () => {
    const [events, setEvents] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [filter, setFilter] = useState({
        type: 'all',
        startDate: '',
        endDate: '',
        cameraId: ''
    });

    // 이벤트 데이터 가져오기
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch('http://localhost:8081/api/history');
                const data = await response.json();
                setEvents(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('이벤트 데이터 로딩 실패:', error);
                setEvents([]);
            }
        };

        fetchEvents();
    }, []);

    // 필터링된 이벤트 목록
    const filteredEvents = events
        .filter(event => {
            const type = (event.eventType || '').toLowerCase();
            const filterType = (filter.type || '').toLowerCase();
            if (filterType !== 'all' && filterType !== '' && type !== filterType) return false;
            if (filter.startDate && new Date(event.timestamp) < new Date(filter.startDate)) return false;
            if (filter.endDate && new Date(event.timestamp) > new Date(filter.endDate)) return false;
            if (filter.cameraId && event.cameraId !== filter.cameraId) return false;
            return true;
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // timestamp 기준 내림차순 정렬

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getEventTypeChip = (type) => {
        const t = (type || '').toLowerCase();
        if (t === 'fall' || t === '넘어짐' || t === 'FALL') return <Chip label="넘어짐" color="error" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5 }} />;
        if (t === 'reverse_driving' || t === '역주행') return <Chip label="역주행" color="warning" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5 }} />;
        return <Chip label={type} color="primary" size="small" sx={{ fontWeight: 700, fontSize: 14, px: 1.5 }} />;
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', background: '#fff', mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#222', mb: 2 }}>
                이상행동 이력
            </Typography>

            {/* 필터 섹션 */}
            <Grid container spacing={2} sx={{ mb: 2, p: 2, borderRadius: 2, background: '#f5f7fa', boxShadow: '0 1px 6px 0 rgba(49,130,246,0.04)' }}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        select
                        fullWidth
                        label="이벤트 유형"
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                    >
                        <MenuItem value="all">전체</MenuItem>
                        <MenuItem value="fall">넘어짐</MenuItem>
                        <MenuItem value="reverse_driving">역주행</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        type="date"
                        fullWidth
                        label="시작일"
                        value={filter.startDate}
                        onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        type="date"
                        fullWidth
                        label="종료일"
                        value={filter.endDate}
                        onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="카메라 ID"
                        value={filter.cameraId}
                        onChange={(e) => setFilter({ ...filter, cameraId: e.target.value })}
                    />
                </Grid>
            </Grid>

            {/* 이벤트 테이블 */}
            <TableContainer sx={{ borderRadius: 2, boxShadow: '0 1px 6px 0 rgba(49,130,246,0.04)' }}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow sx={{ background: '#f9fafb' }}>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>시간</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>유형</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>카메라</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: '#222' }}>상세내용</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEvents
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((event) => (
                                <TableRow key={event.id} hover sx={{ transition: 'background 0.2s', '&:hover': { background: '#e8f1fd' } }}>
                                    <TableCell>{format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}</TableCell>
                                    <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                                    <TableCell>{event.cameraId}</TableCell>
                                    <TableCell>{event.detail}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredEvents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="페이지당 행 수"
            />
        </Paper>
    );
};

export default EventHistory; 