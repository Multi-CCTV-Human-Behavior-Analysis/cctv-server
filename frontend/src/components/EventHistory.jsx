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
                const response = await fetch('http://localhost:8080/api/events');
                const data = await response.json();
                setEvents(data);
            } catch (error) {
                console.error('이벤트 데이터 로딩 실패:', error);
            }
        };

        fetchEvents();
    }, []);

    // 필터링된 이벤트 목록
    const filteredEvents = events.filter(event => {
        if (filter.type !== 'all' && event.eventType !== filter.type) return false;
        if (filter.startDate && new Date(event.timestamp) < new Date(filter.startDate)) return false;
        if (filter.endDate && new Date(event.timestamp) > new Date(filter.endDate)) return false;
        if (filter.cameraId && event.cameraId !== filter.cameraId) return false;
        return true;
    });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const getEventTypeChip = (type) => {
        const typeConfig = {
            fall: { label: '넘어짐', color: 'error' },
            reverse_driving: { label: '역주행', color: 'warning' },
            default: { label: type, color: 'default' }
        };

        const config = typeConfig[type] || typeConfig.default;
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                이상행동 이력
            </Typography>

            {/* 필터 섹션 */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
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
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>시간</TableCell>
                            <TableCell>유형</TableCell>
                            <TableCell>카메라</TableCell>
                            <TableCell>상세내용</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredEvents
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell>
                                        {format(new Date(event.timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: ko })}
                                    </TableCell>
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