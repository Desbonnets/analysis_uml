package com.example.analysisservice.dto;

import com.example.analysisservice.model.CodeUnit;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalysisResponse {
    private Long projectId;
    private String storageKey;
    private String status;
    private String message;
    private int filesAnalyzed;
    private int classesFound;
    private List<CodeUnit> codeUnits;
    @Builder.Default private List<String> unsupportedLanguages = new java.util.ArrayList<>();
}
