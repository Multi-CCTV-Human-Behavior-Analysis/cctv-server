import React, { useState, useEffect, useRef } from 'react';
import {
    Typography, Paper, TextField, Button,
    MenuItem, Select, FormControl, InputLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Grid, TablePagination, Dialog, DialogContent, DialogTitle, 
    IconButton, Box, Chip, CircularProgress
} from '@mui/material';
import { PlayArrow, Close } from '@mui/icons-material';

function HistoryPage() {
    // 필터 상태
    const [eventType, setEventType] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [history, setHistory] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // 클립 재생 관련 상태
    const [videoDialogOpen, setVideoDialogOpen] = useState(false);
    const [currentVideoUrl, setCurrentVideoUrl] = useState('');
    const [currentEventId, setCurrentEventId] = useState(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState('');
    const videoRef = useRef(null);

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

    // 클립 영상 재생 함수
    const handlePlayClip = async (eventId) => {
        if (!eventId) {
            console.error('이벤트 ID가 필요합니다.');
            return;
        }

        setVideoLoading(true);
        setVideoError('');
        setCurrentEventId(eventId);

        try {
            // 백엔드 클립 API 호출
            const url = `http://localhost:8080/api/clip/${eventId}`;
            console.log('클립 영상 요청:', url);
            
            setCurrentVideoUrl(url);
            setVideoDialogOpen(true);
            
        } catch (error) {
            console.error('클립 영상 로드 오류:', error);
            setVideoError('영상을 불러오는데 실패했습니다.');
        } finally {
            setVideoLoading(false);
        }
    };

    // 비디오 다이얼로그 닫기
    const handleCloseVideo = () => {
        setVideoDialogOpen(false);
        setCurrentVideoUrl('');
        setCurrentEventId(null);
        setVideoError('');
        
        // 비디오 정지
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
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

    // 이벤트 타입에 따른 칩 색상
    const getEventTypeChip = (type) => {
        const typeConfig = {
            'FALL': { label: '넘어짐', color: 'error' },
            'REVERSE': { label: '역주행', color: 'warning' },
            'fall': { label: '넘어짐', color: 'error' },
            'reverse_driving': { label: '역주행', color: 'warning' },
            'thief': { label: '침입', color: 'secondary' }
        };
        const config = typeConfig[type] || { label: type, color: 'primary' };
        return (
            <Chip 
                label={config.label} 
                color={config.color} 
                size="small" 
                sx={{ fontWeight: 600, fontSize: 12 }} 
            />
        );
    };

    // 현재 페이지에 보여줄 데이터
    const pagedHistory = history.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <>
            <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', background: '#fff', mt: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#222', mb: 3 }}>
                    이상행동 이력
                </Typography>
                
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
                        <Button 
                            variant="contained" 
                            onClick={handleFilter} 
                            sx={{ height: 56, fontWeight: 700, fontSize: 16, borderRadius: 2, boxShadow: 'none' }}
                        >
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
                            {pagedHistory.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="text.secondary">
                                            조건에 맞는 이력이 없습니다.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pagedHistory.map((event) => (
                                    <TableRow 
                                        key={event.id} 
                                        hover 
                                        sx={{ 
                                            transition: 'background 0.2s', 
                                            '&:hover': { background: '#e8f1fd' } 
                                        }}
                                    >
                                        <TableCell sx={{ fontWeight: 600 }}>{event.id}</TableCell>
                                        <TableCell>{getEventTypeChip(event.eventType)}</TableCell>
                                        <TableCell>{event.description || event.detail || '상세 정보 없음'}</TableCell>
                                        <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={
                                                    videoLoading && currentEventId === event.id ? 
                                                    <CircularProgress size={16} color="inherit" /> : 
                                                    <PlayArrow />
                                                }
                                                onClick={() => handlePlayClip(event.id)}
                                                disabled={videoLoading && currentEventId === event.id}
                                                sx={{
                                                    borderRadius: 2,
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    px: 2,
                                                    py: 0.5,
                                                    minWidth: 100,
                                                    backgroundColor: '#3182f6',
                                                    '&:hover': {
                                                        backgroundColor: '#2563eb'
                                                    }
                                                }}
                                            >
                                                {videoLoading && currentEventId === event.id ? '로딩중' : '클립 보기'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
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

            {/* 클립 재생 다이얼로그 */}
            <Dialog 
                open={videoDialogOpen} 
                onClose={handleCloseVideo} 
                maxWidth="lg" 
                fullWidth
                sx={{
                    '& .MuiDialog-paper': {
                        borderRadius: 3,
                        boxShadow: '0 8px 32px 0 rgba(49,130,246,0.20)'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    fontWeight: 700, 
                    fontSize: 20, 
                    color: '#222',
                    borderBottom: '1px solid #e5e8eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    클립 영상 (이벤트 ID: {currentEventId})
                    <IconButton 
                        onClick={handleCloseVideo}
                        sx={{ 
                            color: '#666',
                            '&:hover': { 
                                backgroundColor: '#f5f7fa',
                                color: '#222'
                            }
                        }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 3, backgroundColor: '#000' }}>
                    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                        {videoError ? (
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: 8,
                                backgroundColor: '#1a1a1a',
                                borderRadius: 2
                            }}>
                                <Typography variant="h6" sx={{ color: '#ff5b56', fontWeight: 600, mb: 2 }}>
                                    영상 재생 오류
                                </Typography>
                                <Typography sx={{ color: '#999' }}>
                                    {videoError}
                                </Typography>
                            </Box>
                        ) : (
                            currentVideoUrl && (
                                <video
                                    ref={videoRef}
                                    controls
                                    autoPlay
                                    style={{ 
                                        width: '100%', 
                                        maxHeight: '70vh',
                                        borderRadius: 8,
                                        backgroundColor: '#000'
                                    }}
                                    src={currentVideoUrl}
                                    onError={() => setVideoError('영상을 재생할 수 없습니다. 파일이 없거나 지원하지 않는 형식입니다.')}
                                >
                                    브라우저가 비디오를 지원하지 않습니다.
                                </video>
                            )
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </>
    );
}

export default HistoryPage;