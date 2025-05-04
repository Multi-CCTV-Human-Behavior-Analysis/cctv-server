package com.knu.capstone2.log;

import jakarta.annotation.PostConstruct;
import java.nio.file.Paths;
import org.springframework.stereotype.Component;

@Component
public class AppStartupLogger {

    @PostConstruct
    public void logWorkingDirAndJar() {
        // 1) 현재 작업 디렉터리
        String workingDir = Paths.get("").toAbsolutePath().toString();
        System.out.println("▶ 현재 작업 디렉터리(user.dir): " + workingDir);

        // 2) 실행 중인 JAR 파일 경로
        String jarLocation = AppStartupLogger.class
                .getProtectionDomain()
                .getCodeSource()
                .getLocation()
                .getPath();
        System.out.println("▶ 실행 중인 JAR 파일 위치: " + jarLocation);
    }
}