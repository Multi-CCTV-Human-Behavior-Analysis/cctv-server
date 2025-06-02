// src/components/VideoStream.jsx
import React from 'react';

const VideoStream = ({ rtsp, name }) => {
  return (
    <div>
      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>{name}</div>
      <img
        src={`http://localhost:5000/video_feed`}
        alt={name || 'CCTV Stream'}
        style={{ width: '640px', height: '480px', border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default VideoStream;
