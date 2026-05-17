package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisRecord {
    private String recordId;
    private Long projectId;
    private String projectName;
    private LocalDateTime analyzedAt;
    private String zipStorageKey;
    private int filesAnalyzed;
    private int classesFound;
    private List<String> unsupportedLanguages = new ArrayList<>();
    private List<CodeUnit> codeUnits = new ArrayList<>();
}
