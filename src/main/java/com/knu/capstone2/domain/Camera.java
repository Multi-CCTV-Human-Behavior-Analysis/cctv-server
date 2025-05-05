package com.knu.capstone2.domain;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class Camera {

    private String id;
    private String name;
    private String status;
    private String streamUrl;
}
