// src/components/VideoStream.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

const VideoStream = () => {
    const videoRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const wsRef = useRef(null);
    const queueRef = useRef([]);
    const isBufferUpdatingRef = useRef(false);
    const [useLocalCamera, setUseLocalCamera] = useState(false);

    useEffect(() => {
        const initLocalCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 1280,
                        height: 720,
                        frameRate: 30
                    }
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
                console.log('로컬 카메라 스트림 시작됨');
            } catch (err) {
                console.error('로컬 카메라 접근 실패:', err);
            }
        };

        const initWebSocket = () => {
            console.log('WebSocket 연결 시도...');
            wsRef.current = new WebSocket('ws://localhost:8080/ws/video');

            wsRef.current.onopen = () => {
                console.log('WebSocket 연결 성공!');
                setUseLocalCamera(false);
            };

            wsRef.current.onmessage = (event) => {
                if (event.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const arrayBuffer = reader.result;
                        if (!sourceBufferRef.current) {
                            queueRef.current.push(arrayBuffer);
                            return;
                        }

                        if (isBufferUpdatingRef.current) {
                            queueRef.current.push(arrayBuffer);
                            return;
                        }

                        try {
                            isBufferUpdatingRef.current = true;
                            sourceBufferRef.current.appendBuffer(arrayBuffer);
                        } catch (e) {
                            console.error('버퍼 추가 실패:', e);
                            isBufferUpdatingRef.current = false;
                        }
                    };
                    reader.readAsArrayBuffer(event.data);
                }
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket 연결 종료:', event.code, event.reason);
                setUseLocalCamera(true);
                initLocalCamera();
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket 에러:', error);
                setUseLocalCamera(true);
                initLocalCamera();
            };
        };

        const initMediaSource = () => {
            if (!useLocalCamera && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"')) {
                console.log('MediaSource 초기화 시작');
                mediaSourceRef.current = new MediaSource();
                videoRef.current.src = URL.createObjectURL(mediaSourceRef.current);

                mediaSourceRef.current.addEventListener('sourceopen', () => {
                    try {
                        sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer(
                            'video/mp4; codecs="avc1.42E01E,mp4a.40.2"'
                        );

                        sourceBufferRef.current.addEventListener('updateend', () => {
                            isBufferUpdatingRef.current = false;
                            if (queueRef.current.length > 0) {
                                const nextBuffer = queueRef.current.shift();
                                try {
                                    isBufferUpdatingRef.current = true;
                                    sourceBufferRef.current.appendBuffer(nextBuffer);
                                } catch (e) {
                                    console.error('큐의 다음 버퍼 추가 실패:', e);
                                    isBufferUpdatingRef.current = false;
                                }
                            }
                        });

                        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                            wsRef.current.send('init');
                        }
                    } catch (e) {
                        console.error('SourceBuffer 생성 실패:', e);
                        setUseLocalCamera(true);
                        initLocalCamera();
                    }
                });
            }
        };

        if (!useLocalCamera) {
            initMediaSource();
            initWebSocket();
        } else {
            initLocalCamera();
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                mediaSourceRef.current.endOfStream();
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, [useLocalCamera]);

    return (
        <Paper elevation={3} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                실시간 CCTV 영상 {useLocalCamera && '(로컬 카메라)'}
            </Typography>
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: 'calc(100% - 40px)',
                    bgcolor: 'black',
                    overflow: 'hidden',
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                    autoPlay
                    playsInline
                    muted
                />
            </Box>
        </Paper>
    );
};

export default VideoStream;
