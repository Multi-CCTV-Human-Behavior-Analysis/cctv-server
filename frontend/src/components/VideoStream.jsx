// src/components/VideoStream.jsx
import React from 'react';

const VideoStream = ({ rtsp, name }) => {
  // rtsp 주소를 파이썬 서버로 쿼리로 전달
  const src = rtsp
    ? `http://localhost:5050/video_feed?rtsp=${encodeURIComponent(rtsp)}`
    : `http://localhost:5050/video_feed`;
  return (
    <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 2px 16px 0 rgba(49,130,246,0.10)', border: '1.5px solid #e5e8eb', background: '#fff' }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        background: 'rgba(49,130,246,0.85)',
        color: '#fff',
        fontWeight: 700,
        fontSize: 18,
        padding: '8px 20px',
        zIndex: 2,
        letterSpacing: 1,
        borderBottomRightRadius: 12,
        opacity: 0.95
      }}>{name}</div>
      <img
        src={src}
        alt={name || 'CCTV Stream'}
        style={{ width: '100%', height: 320, objectFit: 'cover', display: 'block', borderRadius: 18, border: 'none' }}
      />
    </div>
  );
};

export default VideoStream;
