package com.example.analysisservice.dto;

import com.example.analysisservice.model.CodeUnit;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Request body for POST /analysis/{projectId}/ingest.
 * Accepts pre-computed analysis results (no ZIP required).
 */
@Data
public class IngestRequest {
    private String projectName;
    private int filesAnalyzed;
    private int classesFound;
    private List<String> unsupportedLanguages = new ArrayList<>();
    private List<CodeUnit> codeUnits = new ArrayList<>();
}
