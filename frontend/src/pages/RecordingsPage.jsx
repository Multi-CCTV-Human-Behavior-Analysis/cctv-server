import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Dialog, DialogContent, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';

function RecordingsPage() {
    const [videos, setVideos] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                {Array.isArray(videos) && videos.length === 0 && (
                    <Grid item xs={12}>
                        <Typography color="text.secondary">
                            {error ? '동영상 목록을 불러올 수 없습니다.' : '녹화된 영상이 없습니다.'}
                        </Typography>
                    </Grid>
                )}
                
                {Array.isArray(videos) && videos.map((video) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={video}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', overflow: 'hidden', position: 'relative' }}>
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
                                <IconButton color="primary" onClick={() => handleOpen(video)}>
                                    <PlayArrowIcon />
                                </IconButton>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            
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