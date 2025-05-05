import React, { useEffect, useRef } from 'react';

const VideoStream = ({ streamUrl }) => {
    const videoRef = useRef(null);
    const mediaSource = useRef(null);
    const sourceBuffer = useRef(null);

    useEffect(() => {
        const video = videoRef.current;
        mediaSource.current = new MediaSource();
        video.src = URL.createObjectURL(mediaSource.current);

        const ws = new WebSocket(streamUrl);

        mediaSource.current.addEventListener("sourceopen", () => {
            sourceBuffer.current = mediaSource.current.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');

            ws.onmessage = (event) => {
                if (sourceBuffer.current && !sourceBuffer.current.updating) {
                    const chunk = new Uint8Array(event.data);
                    sourceBuffer.current.appendBuffer(chunk);
                }
            };
        });

        return () => {
            ws.close();
        };
    }, [streamUrl]);

    return (
        <video ref={videoRef} controls autoPlay muted style={{ width: "100%" }} />
    );
};

export default VideoStream;
