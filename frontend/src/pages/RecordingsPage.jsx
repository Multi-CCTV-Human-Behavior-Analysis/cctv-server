import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardMedia, Dialog, DialogContent, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';

function RecordingsPage() {
    const [videos, setVideos] = useState([]);
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        // public/recordings 폴더의 mp4 파일을 직접 가져오기 (정적 파일 제공)
        // 브라우저에서는 폴더 내 파일 리스트를 직접 가져올 수 없으므로,
        // recordings 폴더에 recordings.json 파일을 두고, 그 파일을 fetch해서 리스트를 가져오는 방식으로 구현
        fetch('/recordings/recordings.json')
            .then(res => res.json())
            .then(data => setVideos(data))
            .catch(() => setVideos([]));
    }, []);

    const handleOpen = (video) => {
        setSelected(video);
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
        setSelected(null);
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#222', mb: 3 }}>녹화영상</Typography>
            <Grid container spacing={3}>
                {videos.length === 0 && (
                    <Grid item xs={12}><Typography color="text.secondary">녹화된 영상이 없습니다.</Typography></Grid>
                )}
                {videos.map((video) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={video}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', overflow: 'hidden', position: 'relative' }}>
                            <CardMedia
                                component="video"
                                src={`/recordings/${video}`}
                                sx={{ height: 180, objectFit: 'cover', background: '#eee' }}
                                controls={false}
                                muted
                                onClick={() => handleOpen(video)}
                            />
                            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{video}</Typography>
                                <IconButton color="primary" onClick={() => handleOpen(video)}>
                                    <PlayArrowIcon />
                                </IconButton>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogContent sx={{ p: 0, bgcolor: '#000' }}>
                    <Box sx={{ position: 'relative' }}>
                        <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: '#fff' }}>
                            <CloseIcon />
                        </IconButton>
                        {selected && (
                            <video src={`/recordings/${selected}`} controls autoPlay style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default RecordingsPage; 