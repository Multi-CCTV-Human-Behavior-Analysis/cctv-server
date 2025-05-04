package com.knu.capstone2.dto;

import java.time.LocalDateTime;

public record AddEventHistoryRequest (
    String eventType,       // 이벤트 종류
    LocalDateTime timestamp, // 발생 시각
    String detail,          // (선택) 추가 설명이나 메타데이터
    String cameraId,     // 어떤 CCTV에서 왔는지

    /** 클립 시작 시각 (절대 시각), timestamp 이전일 수 있음 */
    LocalDateTime clipStartTime,
    LocalDateTime clipEndTime
) {}
