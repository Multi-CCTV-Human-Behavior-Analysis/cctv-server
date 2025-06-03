package com.knu.capstone2.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.Map;

@Service
public class AbnormalDetectService {
    private static final String PYTHON_PATH = "python"; // 또는 python3
    private static final String SCRIPT_PATH = "ai_server/prediction.py";

    public Map<String, Object> detectAbnormal(Map<String, Object> skeletonData) throws IOException, InterruptedException {
        ObjectMapper mapper = new ObjectMapper();
        String jsonData = mapper.writeValueAsString(skeletonData);
        System.out.println("[DEBUG] 전달할 JSON: " + jsonData);

        System.out.println("[DEBUG] 파이썬 실행 준비");
        ProcessBuilder pb = new ProcessBuilder(PYTHON_PATH, SCRIPT_PATH);
        Process process = pb.start();
        System.out.println("[DEBUG] 파이썬 프로세스 실행됨");

        // 파이썬에 데이터 전달
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
        writer.write(jsonData);
        writer.flush();
        writer.close();
        System.out.println("[DEBUG] 파이썬에 데이터 전달 완료");

        // 파이썬에서 결과 받아오기
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        StringBuilder result = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            result.append(line);
        }
        System.out.println("[DEBUG] 파이썬 결과 수신 완료: " + result.toString());

        // 파이썬 에러 출력 받기
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
        StringBuilder errorResult = new StringBuilder();
        while ((line = errorReader.readLine()) != null) {
            errorResult.append(line).append("\n");
        }
        System.out.println("[DEBUG] 파이썬 에러: " + errorResult.toString());

        // 프로세스 종료 후 오류 확인
        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("Python script failed with error: " + errorResult.toString());
        }

        // 결과 JSON 파싱
        return mapper.readValue(result.toString(), Map.class);
    }
} 