package com.example.analysisservice.dto;

import com.example.analysisservice.model.CodeUnit;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Full analysis record stored as JSON in MinIO.
 * Only serialized (written) by Jackson — never deserialized back into this type.
 */
@Data
@Builder
public class AnalysisRecord {
    private String recordId;
    private Long projectId;
    private String projectName;
    private LocalDateTime analyzedAt;
    private String zipStorageKey;
    private int filesAnalyzed;
    private int classesFound;
    @Builder.Default private List<String> unsupportedLanguages = new java.util.ArrayList<>();
    @Builder.Default private List<CodeUnit> codeUnits = new java.util.ArrayList<>();
}
