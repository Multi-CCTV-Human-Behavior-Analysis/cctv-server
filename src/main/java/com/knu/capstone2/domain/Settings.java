package com.knu.capstone2.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Settings {

    private boolean notificationEnabled;
    private boolean autoSaveClips;
}
