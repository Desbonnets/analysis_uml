package com.example.servicemetier1.dto;

import lombok.Data;

@Data
public class SubmitAnalysisRequest {
    private Integer score;
    private Integer violationsCount;
    private Integer diagramsCount;
    private String status;
}
