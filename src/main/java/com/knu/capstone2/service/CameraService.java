package com.knu.capstone2.service;

import com.knu.capstone2.domain.Camera;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class CameraService {

    public List<Camera> getCameraList() {
        return Arrays.asList(
                new Camera("camera-1", "Camera 1", "ONLINE", "ws://localhost:8080/video-stream/camera-1"),
                new Camera("camera-2", "Camera 2", "OFFLINE", "ws://localhost:8080/video-stream/camera-2"),
                new Camera("camera-3", "Camera 3", "ONLINE", "ws://localhost:8080/video-stream/camera-3")
        );
    }
}
