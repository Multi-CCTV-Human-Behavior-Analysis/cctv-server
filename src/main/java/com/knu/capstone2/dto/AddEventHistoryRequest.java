package com.knu.capstone2.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;

@Schema(description = "이벤트 히스토리 추가 요청 DTO")
public record AddEventHistoryRequest (
        @Schema(description = "이벤트 타입", example = "FALL", allowableValues = {"motion", "audio", "alarm"})
        String eventType,

        @Schema(description = "이벤트 발생 시간", example = "2024-01-01T00:00:00")
        LocalDateTime timestamp,

        @Schema(description = "이벤트 설명", example = "에스컬레이터에서 낙상 발생")
        String detail,

        @Schema(description = "카메라 id (1번 카메라의 경우)", example = "101")
        String cameraId,

        @Schema(description = "클립 시작 시간. timestamp 와 별개", example = "2024-01-01T00:00:00")
        LocalDateTime clipStartTime,

        @Schema(description = "클립 종료 시간. timestamp 와 별개", example = "2024-01-01T00:00:00")
        LocalDateTime clipEndTime
) {}
