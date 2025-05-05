package com.knu.capstone2.service;

import com.knu.capstone2.repository.EventHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EventHistoryRepository eventHistoryRepository;

    public Map<String, Object> getDashboardData() {
        Map<String, Object> result = new HashMap<>();

        long abnormalCount = eventHistoryRepository.count();
        long cameraCount = 5;  // 현재는 임시 값
        long alertCount = abnormalCount;
        String systemStatus = "정상";

        result.put("abnormalCount", abnormalCount);
        result.put("cameraCount", cameraCount);
        result.put("alertCount", alertCount);
        result.put("systemStatus", systemStatus);

        return result;
    }
}
