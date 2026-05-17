package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisHistoryEntry {
    private String recordId;
    private Long projectId;
    private String projectName;
    private String analyzedAt;
    private int filesAnalyzed;
    private int classesFound;
    private List<String> unsupportedLanguages = new ArrayList<>();
}
