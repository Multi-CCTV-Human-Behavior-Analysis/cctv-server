import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Dialog, DialogContent, IconButton, Pagination, TextField, Stack, Button, Checkbox, FormControlLabel } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';

function RecordingsPage() {
    const [videos, setVideos] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const itemsPerPage = 12;
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [timeFrom, setTimeFrom] = useState("");
    const [timeTo, setTimeTo] = useState("");
    const [selectedVideos, setSelectedVideos] = useState([]);
    const filteredVideos = videos.filter(v => v.toLowerCase().includes(search.toLowerCase()) && isInDateTimeRange(v));
    const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
    const pagedVideos = filteredVideos.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    useEffect(() => {
        setLoading(true);
        fetch('/recordings/recordings.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error('recordings.json 파일을 찾을 수 없습니다.');
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setVideos(data);
                } else {
                    console.warn('recordings.json의 데이터가 배열이 아닙니다:', data);
                    setVideos([]);
                }
                setError(null);
            })
            .catch(err => {
                console.error('동영상 목록을 불러오는 중 오류 발생:', err);
                setVideos([]);
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        setPage(1); // 검색어가 바뀌면 1페이지로 이동
    }, [search]);

    const handleOpen = (video) => {
        console.log('Opening video:', video);
        setSelected(video);
        // setTimeout을 사용해서 상태 업데이트가 확실히 되도록 함
        setTimeout(() => {
            setOpen(true);
        }, 10);
    };
    
    const handleClose = () => {
        console.log('Closing dialog');
        setOpen(false);
        setSelected(null);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleResetFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
        setTimeFrom("");
        setTimeTo("");
    };

    const handleSelectVideo = (video) => {
        setSelectedVideos(prev => prev.includes(video) ? prev.filter(v => v !== video) : [...prev, video]);
    };
    const handleSelectAll = (checked) => {
        if (checked) setSelectedVideos(pagedVideos.map(v => v));
        else setSelectedVideos([]);
    };
    const handleDeleteSelected = async () => {
        if (selectedVideos.length === 0) return;
        if (!window.confirm(`정말 ${selectedVideos.length}개의 영상을 삭제하시겠습니까?`)) return;
        // 실제 파일 삭제 요청 (백엔드 API 필요)
        for (const video of selectedVideos) {
            try {
                await fetch(`/api/clip/recordings/${video}`, { method: 'DELETE' });
            } catch (e) {
                // 실패해도 계속 진행
            }
        }
        // recordings.json 갱신 (프론트엔드에서만 반영, 실제로는 백엔드에서 관리 필요)
        setVideos(prev => prev.filter(v => !selectedVideos.includes(v)));
        setSelectedVideos([]);
    };

    // 파일명에서 날짜/시간 추출 함수
    function parseDatetimeFromFilename(filename) {
        const match = filename.match(/(\d{8})_(\d{4})/);
        if (!match) return null;
        const [_, date, time] = match;
        const year = date.slice(0, 4);
        const month = date.slice(4, 6);
        const day = date.slice(6, 8);
        const hour = time.slice(0, 2);
        const min = time.slice(2, 4);
        return `${year}-${month}-${day} ${hour}:${min}`;
    }

    // 날짜/시간 필터링 함수
    function isInDateTimeRange(filename) {
        const match = filename.match(/(\d{8})_(\d{4})/);
        if (!match) return true; // 규칙에 안 맞으면 필터링 안 함
        const [_, date, time] = match;
        const dt = `${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}T${time.slice(0,2)}:${time.slice(2,4)}`;
        const dtObj = new Date(dt);
        if (dateFrom && dtObj < new Date(dateFrom + (timeFrom ? 'T'+timeFrom : 'T00:00'))) return false;
        if (dateTo && dtObj > new Date(dateTo + (timeTo ? 'T'+timeTo : 'T23:59'))) return false;
        return true;
    }

    // 로딩 중일 때
    if (loading) {
        return (
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#222', mb: 3 }}>녹화영상</Typography>
                <Typography color="text.secondary">동영상 목록을 불러오는 중...</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#222', mb: 3 }}>녹화영상</Typography>
            {/* 검색 입력창 + 날짜/시간 필터 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                    label="검색"
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="파일명 검색"
                />
                <TextField
                    label="시작 날짜"
                    type="date"
                    size="small"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="종료 날짜"
                    type="date"
                    size="small"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="시작 시간"
                    type="time"
                    size="small"
                    value={timeFrom}
                    onChange={e => setTimeFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="종료 시간"
                    type="time"
                    size="small"
                    value={timeTo}
                    onChange={e => setTimeTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
                <Button variant="outlined" color="secondary" onClick={handleResetFilters} sx={{ minWidth: 120 }}>
                    필터 초기화
                </Button>
            </Stack>
            
            {/* 선택 삭제 및 전체 선택 */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <FormControlLabel
                    control={<Checkbox checked={selectedVideos.length === pagedVideos.length && pagedVideos.length > 0} onChange={e => handleSelectAll(e.target.checked)} />}
                    label="전체 선택"
                />
                <Button variant="contained" color="error" disabled={selectedVideos.length === 0} onClick={handleDeleteSelected}>
                    선택 삭제
                </Button>
                <Typography variant="body2" color="text.secondary">
                    {selectedVideos.length > 0 ? `${selectedVideos.length}개 선택됨` : ''}
                </Typography>
            </Stack>
            
            {/* 디버그 정보 */}
            <Typography sx={{ mb: 2, fontSize: 12, color: 'gray' }}>
                Debug: open={open.toString()}, selected={selected || 'none'}
            </Typography>
            
            {/* 오류 메시지 표시 */}
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    오류: {error}
                </Typography>
            )}
            
            <Grid container spacing={3}>
                {Array.isArray(pagedVideos) && pagedVideos.length === 0 && (
                    <Grid item xs={12}>
                        <Typography color="text.secondary">
                            {error ? '동영상 목록을 불러올 수 없습니다.' : '녹화된 영상이 없습니다.'}
                        </Typography>
                    </Grid>
                )}
                
                {Array.isArray(pagedVideos) && pagedVideos.map((video) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={video}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', overflow: 'hidden', position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
                                <Checkbox checked={selectedVideos.includes(video)} onChange={() => handleSelectVideo(video)} color="primary" />
                            </Box>
                            <CardMedia
                                component="video"
                                src={`/recordings/${video}`}
                                sx={{ height: 180, objectFit: 'cover', background: '#eee', cursor: 'pointer' }}
                                controls={false}
                                muted
                                onClick={() => handleOpen(video)}
                            />
                            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {video}
                                </Typography>
                                {/* 날짜/시간 정보 */}
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    {parseDatetimeFromFilename(video) || '-'}
                                </Typography>
                                <IconButton color="primary" onClick={() => handleOpen(video)}>
                                    <PlayArrowIcon />
                                </IconButton>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
                </Box>
            )}
            
            {/* 동영상 재생 다이얼로그 - 간소화된 버전 */}
            {open && (
                <Dialog 
                    open={open} 
                    onClose={handleClose} 
                    maxWidth={false}
                    fullWidth
                    sx={{
                        '& .MuiDialog-paper': {
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            backgroundColor: '#000',
                            margin: 2
                        }
                    }}
                >
                    <DialogContent sx={{ p: 0, position: 'relative' }}>
                        {/* 닫기 버튼 */}
                        <IconButton 
                            onClick={handleClose} 
                            sx={{ 
                                position: 'absolute', 
                                top: 16, 
                                right: 16, 
                                zIndex: 1000, 
                                color: '#fff',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.8)'
                                }
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        
                        {/* 동영상 플레이어 */}
                        {selected && (
                            <Box sx={{ width: '100%', minHeight: '50vh' }}>
                                <video 
                                    key={`video-${selected}`}
                                    src={`/recordings/${selected}`}
                                    controls 
                                    autoPlay 
                                    style={{ 
                                        width: '100%', 
                                        height: 'auto',
                                        display: 'block'
                                    }}
                                    onLoadStart={() => console.log('비디오 로딩 시작:', selected)}
                                    onCanPlay={() => console.log('비디오 재생 가능:', selected)}
                                    onError={(e) => {
                                        console.error('비디오 에러:', e.target.error);
                                        alert(`동영상을 재생할 수 없습니다: ${selected}`);
                                    }}
                                />
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            )}
        </Box>
    );
}

export default RecordingsPage;