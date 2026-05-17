package com.example.analysisservice.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Lightweight summary returned by GET /analysis/{projectId}/history.
 * Built by parsing the stored JSON with JsonNode — no nested CodeUnit deserialization needed.
 */
@Data
@Builder
public class AnalysisHistoryEntry {
    private String recordId;
    private Long projectId;
    private String projectName;
    private String analyzedAt;     // ISO-8601 string, extracted directly from JSON
    private int filesAnalyzed;
    private int classesFound;
    @Builder.Default private List<String> unsupportedLanguages = new java.util.ArrayList<>();
}
