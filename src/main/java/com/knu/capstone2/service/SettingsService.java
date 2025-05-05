package com.knu.capstone2.service;

import com.knu.capstone2.domain.Settings;
import org.springframework.stereotype.Service;

@Service
public class SettingsService {

    private Settings currentSettings = new Settings(true, false);

    public Settings getSettings() {
        return currentSettings;
    }

    public void updateSettings(Settings settings) {
        this.currentSettings = settings;
    }
}
