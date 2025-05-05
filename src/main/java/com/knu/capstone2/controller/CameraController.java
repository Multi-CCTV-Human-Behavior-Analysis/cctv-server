package com.knu.capstone2.controller;

import com.knu.capstone2.domain.Camera;
import com.knu.capstone2.service.CameraService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cameras")
public class CameraController {

    private final CameraService cameraService;

    @GetMapping
    public List<Camera> getCameras() {
        return cameraService.getCameraList();
    }
}
