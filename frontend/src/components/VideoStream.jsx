import React, { useEffect, useRef, useState } from 'react';

const VideoStream = ({ streamUrl }) => {
    const videoRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const [error, setError] = useState(null);
    const [logs, setLogs] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('연결 중...');
    const [isPlaying, setIsPlaying] = useState(false);
    const wsRef = useRef(null);
    const stateChangeTimerRef = useRef(null);
    
    // 큐 및 상태 관리 - 더 단순하게 변경
    const queueRef = useRef([]);
    const isUpdatingRef = useRef(false);
    const hasInitSegmentRef = useRef(false);
    
    // 통계 정보
    const [stats, setStats] = useState({
        receivedBytes: 0,
        startTime: null
    });
    
    // 로그 함수
    const addLog = (message) => {
        console.log(message);
        // setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`].slice(-50));
    };
    
    // 미디어 소스 초기화
    const initializeMedia = () => {
        try {
            addLog('미디어 소스 초기화 시작');
            
            // 이전 리소스 정리
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
                videoRef.current.load();
            }
            
            if (mediaSourceRef.current) {
                try {
                    if (mediaSourceRef.current.readyState === 'open') {
                        mediaSourceRef.current.endOfStream();
                    }
                } catch (e) {
                    addLog(`이전 MediaSource 정리 오류: ${e.message}`);
                }
            }
            
            // 새 미디어 소스 객체 생성
            const ms = new MediaSource();
            mediaSourceRef.current = ms;
            
            // 상태 초기화
            queueRef.current = [];
            isUpdatingRef.current = false;
            hasInitSegmentRef.current = false;
            setIsPlaying(false);
            
            // 미디어 소스 URL 생성 및 비디오에 설정
            const url = URL.createObjectURL(ms);
            
            // 비디오 요소 이벤트 리스너 등록 (중복 방지를 위해 제거 후 등록)
            if (videoRef.current) {
                videoRef.current.onloadedmetadata = () => {
                    addLog('비디오 메타데이터 로드됨');
                };
                
                videoRef.current.onloadeddata = () => {
                    addLog('비디오 데이터 로드됨');
                    attemptPlay();
                };
                
                videoRef.current.oncanplay = () => {
                    addLog('비디오 재생 가능 상태');
                    attemptPlay();
                };
                
                // src 설정은 이벤트 리스너 등록 후에
                videoRef.current.src = url;
            }
            
            addLog(`MediaSource URL 생성: ${url}`);
            
            // sourceopen 이벤트 처리
            ms.addEventListener('sourceopen', handleSourceOpen);
            
            // 다른 미디어 소스 이벤트 리스너
            ms.addEventListener('sourceended', () => addLog('MediaSource 종료됨'));
            ms.addEventListener('sourceclose', () => addLog('MediaSource 닫힘'));
            ms.addEventListener('error', (e) => {
                addLog(`MediaSource 에러: ${e.type}`);
                setError(`MediaSource 에러 발생`);
            });
            
            // 통계 초기화
            setStats({
                receivedBytes: 0,
                startTime: Date.now()
            });
            
        } catch (e) {
            addLog(`미디어 소스 초기화 오류: ${e.message}`);
            setError(`미디어 소스 초기화 오류: ${e.message}`);
        }
    };
    
    // sourceopen 이벤트 핸들러
    const handleSourceOpen = () => {
        addLog('MediaSource 열림');
        
        try {
            // 다양한 코덱 시도 (첫 번째 코드 방식 차용)
            const codecs = [
                'video/mp4; codecs="avc1.42E032,mp4a.40.2"',  // 비디오+오디오
                'video/mp4; codecs="avc1.42E032"',            // 비디오만
                'video/mp4; codecs="avc1.64001E"',            // 높은 프로파일
                'video/mp4; codecs="avc1.42E01E"',            // 기본 프로파일
                'video/mp4'                                   // 자동 감지
            ];
            
            let selectedCodec = null;
            for (const codec of codecs) {
                if (MediaSource.isTypeSupported(codec)) {
                    try {
                        addLog(`MIME 타입 시도: ${codec}`);
                        sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer(codec);
                        addLog(`소스 버퍼 생성됨 (${codec})`);
                        selectedCodec = codec;
                        break;
                    } catch (e) {
                        addLog(`소스 버퍼 생성 실패 (${codec}): ${e.message}`);
                        sourceBufferRef.current = null;
                    }
                } else {
                    addLog(`지원되지 않는 MIME 타입: ${codec}`);
                }
            }
            
            if (!selectedCodec) {
                throw new Error('지원되는 MIME 타입을 찾을 수 없습니다');
            }
            
            // 소스 버퍼 이벤트 핸들러 설정
            sourceBufferRef.current.addEventListener('updateend', handleUpdateEnd);
            sourceBufferRef.current.addEventListener('error', (e) => {
                addLog(`SourceBuffer 오류: ${e.type}`);
                setError('SourceBuffer 오류 발생');
            });
            
        } catch (e) {
            addLog(`소스 버퍼 생성 오류: ${e.message}`);
            setError(`소스 버퍼 생성 오류: ${e.message}`);
        }
    };
    
    // MP4 박스 분석 함수 (첫 번째 코드에서 가져옴)
    const analyzeMP4Boxes = (data) => {
        let offset = 0;
        const boxes = [];
        
        while (offset < data.length) {
            const boxSize = (data[offset] << 24) | (data[offset + 1] << 16) | 
                          (data[offset + 2] << 8) | data[offset + 3];
            const boxType = String.fromCharCode(data[offset + 4], data[offset + 5], 
                                              data[offset + 6], data[offset + 7]);
            
            boxes.push({ type: boxType, size: boxSize });
            addLog(`박스: ${boxType}, 크기: ${boxSize}`);
            
            offset += boxSize;
        }
        
        return boxes;
    };
    
    // 바이너리 데이터 처리 (첫 번째 코드 스타일로 단순화)
    const handleBinaryData = async (data) => {
        try {
            // 세그먼트 타입 확인 (첫 번째 바이트)
            const segmentType = new Uint8Array(data)[0];
            // 실제 데이터는 첫 바이트 이후부터
            const segmentData = data.slice(1);
            
            addLog(`세그먼트 타입: ${segmentType}, 데이터 크기: ${segmentData.byteLength} 바이트`);
            
            // 초기화 세그먼트인 경우 박스 구조 확인
            if (segmentType === 0) {
                addLog('초기화 세그먼트 수신. 박스 분석:');
                analyzeMP4Boxes(new Uint8Array(segmentData));
                hasInitSegmentRef.current = true;
            }
            
            // 통계 정보 업데이트
            setStats(prev => ({
                ...prev,
                receivedBytes: prev.receivedBytes + segmentData.byteLength,
            }));
            
            // 큐에 데이터 추가 및 처리
            queueRef.current.push(segmentData);
            processQueue();
        } catch (err) {
            addLog(`데이터 처리 실패: ${err.message}`);
            setError(`데이터 처리 실패: ${err.message}`);
        }
    };
    
    // 큐 처리 로직 (첫 번째 코드 방식)
    const processQueue = () => {
        if (!isUpdatingRef.current && queueRef.current.length > 0 && 
            sourceBufferRef.current && !sourceBufferRef.current.updating) {
            
            const data = queueRef.current.shift();
            updateSourceBuffer(data);
        }
    };
    
    // 소스 버퍼 업데이트
    const updateSourceBuffer = (data) => {
        if (!sourceBufferRef.current) {
            addLog('SourceBuffer가 없습니다');
            return;
        }
        
        if (sourceBufferRef.current.updating) {
            addLog('SourceBuffer가 업데이트 중입니다');
            queueRef.current.unshift(data); // 다시 큐에 넣기
            return;
        }
        
        try {
            addLog(`SourceBuffer 업데이트 시도: 데이터 크기 ${data.byteLength}`);
            
            // MediaSource가 열려 있는지 확인
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                isUpdatingRef.current = true;
                sourceBufferRef.current.appendBuffer(data);
            } else {
                addLog(`MediaSource가 닫혀 있습니다. 현재 상태: ${mediaSourceRef.current?.readyState}`);
            }
        } catch (err) {
            addLog(`SourceBuffer 업데이트 실패: ${err.message}`);
            
            // QuotaExceededError 처리 (버퍼가 가득 찬 경우)
            if (err.name === 'QuotaExceededError' && sourceBufferRef.current && 
                sourceBufferRef.current.buffered.length > 0) {
                
                try {
                    // 가장 오래된 데이터 제거
                    const start = sourceBufferRef.current.buffered.start(0);
                    const end = sourceBufferRef.current.buffered.start(0) + 1; // 1초만 제거
                    addLog(`버퍼가 가득 참. 오래된 데이터 제거: ${start} - ${end}`);
                    sourceBufferRef.current.remove(start, end);
                    
                    // 제거 후 다시 큐에 넣기
                    queueRef.current.unshift(data);
                } catch (removeErr) {
                    addLog(`버퍼 데이터 제거 실패: ${removeErr.message}`);
                }
            }
            
            isUpdatingRef.current = false;
            processQueue();
        }
    };
    
    // updateend 이벤트 핸들러
    const handleUpdateEnd = () => {
        addLog('SourceBuffer 업데이트 완료');
        isUpdatingRef.current = false;
        processQueue();
        
        // 버퍼링된 범위 확인
        if (videoRef.current && videoRef.current.buffered.length > 0) {
            for (let i = 0; i < videoRef.current.buffered.length; i++) {
                addLog(`버퍼 범위 ${i}: ${videoRef.current.buffered.start(i).toFixed(2)} - ${videoRef.current.buffered.end(i).toFixed(2)}`);
            }
            
            // 초기 재생 시작을 위한 currentTime 조정
            if (videoRef.current.paused && videoRef.current.currentTime === 0) {
                const bufferedStart = videoRef.current.buffered.start(0);
                addLog(`초기 재생 위치를 버퍼 시작점(${bufferedStart.toFixed(2)})으로 설정`);
                videoRef.current.currentTime = bufferedStart;
            }
        }
        
        // 비디오 재생 시도
        attemptPlay();
    };
    
    // 재생 시도
    const attemptPlay = () => {
        if (!videoRef.current || !hasInitSegmentRef.current) return;
        
        addLog(`재생 시도 - 상태: ${videoRef.current.paused ? '일시정지' : '재생 중'}, readyState: ${videoRef.current.readyState}`);
        
        // 버퍼 범위 확인 및 시작 시간 조정
        try {
            if (videoRef.current.buffered.length > 0) {
                const bufferedStart = videoRef.current.buffered.start(0);
                const bufferedEnd = videoRef.current.buffered.end(0);
                
                addLog(`버퍼 범위: ${bufferedStart.toFixed(2)} - ${bufferedEnd.toFixed(2)}`);
                
                // 재생 시간 시작점을 버퍼의 시작점으로 설정
                if (videoRef.current.currentTime < bufferedStart || 
                    videoRef.current.currentTime > bufferedEnd) {
                    addLog(`현재 시간(${videoRef.current.currentTime.toFixed(2)})을 버퍼 시작점(${bufferedStart.toFixed(2)})으로 조정`);
                    videoRef.current.currentTime = bufferedStart;
                }
            }
        } catch (e) {
            addLog(`버퍼 범위 확인 오류: ${e.message}`);
        }
        
        // readyState가 1(HAVE_METADATA) 이상이면 재생 시도
        if (videoRef.current.readyState >= 1 && videoRef.current.paused) {
            // 항상 음소거 상태로 설정 (자동 재생 제한 회피)
            videoRef.current.muted = true;
            
            videoRef.current.play()
                .then(() => {
                    addLog('재생 시작 성공');
                    setIsPlaying(true);
                    setConnectionStatus('재생 중');
                })
                .catch(e => {
                    addLog(`재생 시도 실패: ${e.name} - ${e.message}`);
                    setIsPlaying(false);
                    
                    // 자동 재생 정책 문제인 경우
                    if (e.name === 'NotAllowedError') {
                        addLog('자동 재생 정책으로 인한 실패, 음소거 상태에서 재시도');
                        videoRef.current.muted = true;
                        videoRef.current.play().catch(err => {
                            addLog(`음소거 상태에서도 재생 실패: ${err.message}`);
                        });
                    } else {
                        // 다른 오류인 경우 시간 조정 후 재시도
                        setTimeout(() => {
                            // 타임아웃 콜백이 실행될 때 ref가 유효한지 다시 확인!
                            if (videoRef.current) {
                                addLog('1초 후 재생 재시도');
                                videoRef.current.play().catch(err => {
                                    addLog(`재시도 실패: ${err.message}`);
                                });
                            } else {
                                addLog('재생 재시도 시점에 비디오 요소가 존재하지 않음');
                            }
                        }, 1000);
                    }
                });
        }
    };
    
    // WebSocket 연결
    const connectWebSocket = () => {
        // 기존 WebSocket 정리
        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch (e) {}
            wsRef.current = null;
        }
        
        addLog(`WebSocket 연결: ${streamUrl}`);
        setConnectionStatus('연결 중...');
        
        try {
            const ws = new WebSocket(streamUrl);
            wsRef.current = ws;
            ws.binaryType = 'arraybuffer';  // arrayBuffer 직접 수신
            
            ws.onopen = () => {
                addLog('WebSocket 연결됨');
                setConnectionStatus('연결됨');
                setError(null);
                setStats(prev => ({ ...prev, startTime: Date.now() }));
                
                // 이미 MediaSource가 열려 있고 초기화 세그먼트가 없으면 MediaSource 재초기화
                if (mediaSourceRef.current && !hasInitSegmentRef.current) {
                    addLog('연결 성공 후 미디어 소스 준비 확인');
                    if (mediaSourceRef.current.readyState !== 'open') {
                        addLog('MediaSource가 준비되지 않음, 재초기화');
                        initializeMedia();
                    }
                }
            };
            
            ws.onclose = (e) => {
                addLog(`WebSocket 연결 종료: 코드=${e.code}, 이유=${e.reason || '없음'}`);
                setConnectionStatus('연결 종료됨');
                
                // 정상 종료가 아니면 3초 후 재연결 시도
                if (e.code !== 1000) {
                    setTimeout(connectWebSocket, 3000);
                }
            };
            
            ws.onerror = (e) => {
                addLog('WebSocket 오류 발생');
                setConnectionStatus('연결 오류');
                
                // 서버 재시작 중인 것으로 간주하고 오류 메시지를 명확하게 설정
                setError('서버 연결 실패: 서버가 실행 중인지 확인하세요');
                
                // 오류 발생 시 5초 후 자동 재연결 (첫 번째 코드와 비슷하게)
                setTimeout(connectWebSocket, 5000);
            };
            
            ws.onmessage = (e) => {
                if (e.data) {
                    handleBinaryData(e.data);
                }
            };
        } catch (err) {
            addLog(`WebSocket 초기화 실패: ${err.message}`);
            setError(`WebSocket 초기화 실패: ${err.message}`);
            
            // 3초 후 재연결 시도
            setTimeout(connectWebSocket, 3000);
        }
    };
    
    // 수동 재생 핸들러
    const handlePlay = () => {
        if (!videoRef.current) return;
        
        addLog('수동 재생 시도');
        
        // 음소거 상태로 설정 (자동 재생 제한 회피)
        videoRef.current.muted = true;
        
        videoRef.current.play()
            .then(() => {
                addLog('수동 재생 성공');
                setIsPlaying(true);
                setConnectionStatus('재생 중');
            })
            .catch(e => {
                addLog(`수동 재생 실패: ${e.message}`);
                setIsPlaying(false);
            });
    };
    
    // 완전 재설정
    const fullReset = () => {
        addLog('스트림 완전 재설정 시작');
        
        // WebSocket 재연결
        connectWebSocket();
        
        // 미디어 소스 재초기화
        initializeMedia();
    };
    
    // 바이트 포맷팅 (통계 표시용)
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // 통계 렌더링
    const renderStats = () => {
        if (!stats.startTime) return null;
        
        const duration = (Date.now() - stats.startTime) / 1000;
        const bytesPerSecond = stats.receivedBytes / duration;
        
        return (
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                padding: '5px',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <div>수신: {formatBytes(stats.receivedBytes)} ({formatBytes(bytesPerSecond)}/s)</div>
                <div>시간: {duration.toFixed(1)}초</div>
                {videoRef.current && (
                    <>
                        <div>상태: {videoRef.current.readyState}</div>
                        <div>현재시간: {videoRef.current.currentTime.toFixed(2)}초</div>
                    </>
                )}
            </div>
        );
    };
    
    // 컴포넌트 마운트 시 초기화
    useEffect(() => {
        // 비디오 요소에 이벤트 리스너 추가
        const video = videoRef.current;
        
        if (video) {
            const eventListeners = {
                loadedmetadata: () => {
                    addLog('비디오 메타데이터 로드됨');
                },
                loadeddata: () => {
                    addLog('비디오 데이터 로드됨');
                    attemptPlay();
                },
                playing: () => {
                    addLog('비디오 재생 시작됨');
                    
                    // 타이머 있으면 취소
                    if (stateChangeTimerRef.current) {
                        clearTimeout(stateChangeTimerRef.current);
                        stateChangeTimerRef.current = null;
                    }
                    
                    setIsPlaying(true);
                    setConnectionStatus('재생 중');
                },
                pause: () => {
                    addLog('비디오 일시 정지됨');
                    setIsPlaying(false);
                    // 연결 상태는 유지 (네트워크 연결 중단이 아니므로)
                },
                waiting: () => {
                    addLog('비디오 버퍼링 중');
                    
                    // 1초 이상 버퍼링 상태가 지속될 때만 상태 변경
                    stateChangeTimerRef.current = setTimeout(() => {
                        if (videoRef.current && videoRef.current.readyState < 3) {
                            setConnectionStatus('버퍼링...');
                        }
                    }, 1000);
                },
                error: () => {
                    const errorCode = video.error ? video.error.code : 'unknown';
                    const errorMessage = video.error ? video.error.message : 'unknown';
                    addLog(`비디오 오류: 코드=${errorCode}, 메시지=${errorMessage}`);
                    setError(`비디오 오류: ${errorMessage}`);
                },
                progress: () => {
                    // 비디오 버퍼 진행 상태 확인
                    if (videoRef.current && videoRef.current.buffered.length > 0) {
                        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
                        const duration = videoRef.current.duration;
                        addLog(`버퍼 진행: ${bufferedEnd.toFixed(2)}s / ${duration === Infinity ? '무한' : duration.toFixed(2) + 's'}`);
                    }
                    
                    // 실제 재생 중이면 상태를 '재생 중'으로 복원
                    if (videoRef.current && !videoRef.current.paused) {
                        setConnectionStatus('재생 중');
                        setIsPlaying(true);
                    }
                },
                timeupdate: () => {
                    // 비디오가 실제로 시간이 진행 중이면 '재생 중' 상태로 강제 설정
                    if (videoRef.current && !videoRef.current.paused) {
                        setConnectionStatus('재생 중');
                        setIsPlaying(true);
                    }
                }
            };
            
            // 이벤트 리스너 등록
            Object.entries(eventListeners).forEach(([event, handler]) => {
                video.addEventListener(event, handler);
            });
            
            // 정리 함수에서 이벤트 리스너 제거
            return () => {
                Object.entries(eventListeners).forEach(([event, handler]) => {
                    video.removeEventListener(event, handler);
                });
                
                // 타이머 정리
                if (stateChangeTimerRef.current) {
                    clearTimeout(stateChangeTimerRef.current);
                    stateChangeTimerRef.current = null;
                }
            };
        }
    }, []);
    
    // 스트림 URL 변경 시 초기화
    useEffect(() => {
        // 초기화
        initializeMedia();
        connectWebSocket();
        
        // 컴포넌트 언마운트 시 정리
        return () => {
            addLog('컴포넌트 정리 중...');
            
            // WebSocket 닫기
            if (wsRef.current) {
                try {
                    wsRef.current.close();
                } catch (e) {}
            }
            
            // 미디어 소스 닫기
            if (mediaSourceRef.current && mediaSourceRef.current.readyState === 'open') {
                try {
                    mediaSourceRef.current.endOfStream();
                } catch (e) {}
            }
            
            // 비디오 요소 리셋
            if (videoRef.current) {
                videoRef.current.src = '';
                videoRef.current.load();
            }
            
            // 타이머 정리
            if (stateChangeTimerRef.current) {
                clearTimeout(stateChangeTimerRef.current);
                stateChangeTimerRef.current = null;
            }
        };
    }, [streamUrl]);
    
    return (
        <div>
            <div style={{ position: 'relative' }}>
                <video 
                    ref={videoRef} 
                    controls
                    playsInline
                    muted
                    style={{ 
                        width: "100%", 
                        backgroundColor: "#000", 
                        minHeight: "240px",
                        cursor: "pointer" 
                    }}
                    onClick={handlePlay}
                />
                
                {/* 연결 상태 표시 */}
                <div style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px', 
                    backgroundColor: connectionStatus.includes('재생 중') ? 'rgba(0, 255, 0, 0.6)' : 
                                     connectionStatus.includes('버퍼링') ? 'rgba(255, 165, 0, 0.6)' : 
                                     connectionStatus.includes('연결됨') ? 'rgba(0, 0, 255, 0.6)' :
                                     'rgba(255, 0, 0, 0.6)',
                    color: 'white',
                    padding: '5px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}>
                    {connectionStatus}
                </div>
                
                {/* 로딩 표시 */}
                {(connectionStatus === '연결 중...' || connectionStatus === '연결 종료됨') && !error && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }}>
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                border: '4px solid white',
                                borderTop: '4px solid transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 8px'
                            }} />
                            <p>서버에 연결 중...</p>
                        </div>
                    </div>
                )}
                
                {/* 에러 표시 */}
                {error && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0, 0, 0, 0.75)'
                    }}>
                        <div style={{
                            backgroundColor: '#e74c3c',
                            padding: '16px',
                            borderRadius: '4px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '24px' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
                
                {/* 재생 버튼 오버레이 */}
                {!isPlaying && connectionStatus === '연결됨' && (
                    <div 
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            cursor: 'pointer'
                        }}
                        onClick={handlePlay}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: 0,
                                height: 0,
                                borderTop: '20px solid transparent',
                                borderLeft: '30px solid white',
                                borderBottom: '20px solid transparent',
                                marginLeft: '5px'
                            }}></div>
                        </div>
                    </div>
                )}
                
                {/* 통계 표시 */}
                {renderStats()}
            </div>
            
            {/* CSS 애니메이션을 위한 스타일 */}
            <style>
                {`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                `}
            </style>
        </div>
    );
};

export default VideoStream;
                