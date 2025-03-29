package com.knu.capstone2.controller;

import com.knu.capstone2.service.RtspStreamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/stream")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class StreamController {
    private final RtspStreamService rtspStreamService;

    @PostMapping("/start")
    public ResponseEntity<String> startStream() {
        rtspStreamService.startStreaming();
        return ResponseEntity.ok("스트리밍 시작됨");
    }

    @PostMapping("/stop")
    public ResponseEntity<String> stopStream() {
        rtspStreamService.stopStreaming();
        return ResponseEntity.ok("스트리밍 종료됨");
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("StreamController is running");
    }
}