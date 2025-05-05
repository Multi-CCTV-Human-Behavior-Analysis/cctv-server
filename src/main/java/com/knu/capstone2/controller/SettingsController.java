package com.knu.capstone2.controller;

import com.knu.capstone2.domain.Settings;
import com.knu.capstone2.service.SettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/settings")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping
    public Settings getSettings() {
        return settingsService.getSettings();
    }

    @PostMapping
    public void updateSettings(@RequestBody Settings settings) {
        settingsService.updateSettings(settings);
    }
}
