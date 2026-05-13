package com.example.analysisservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalysisResponse {
    private Long projectId;
    private String storageKey;
    private String status;
    private String message;
}
