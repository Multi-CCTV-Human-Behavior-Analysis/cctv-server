package com.knu.capstone2.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @Column(nullable = false)
    private String eventType;       // 이벤트 종류

    @Column(nullable = false)
    private LocalDateTime timestamp; // 발생 시각

    @Column(length = 500)
    private String detail;          // (선택) 추가 설명이나 메타데이터

    private String cameraId;     // 어떤 CCTV에서 왔는지

    /** 클립 시작 시각 (절대 시각), timestamp 이전일 수 있음 */
    @Column(nullable = false)
    private LocalDateTime clipStartTime;
    @Column(nullable = false)
    private LocalDateTime clipEndTime;

    @Setter
    private String clipFilename;
}
