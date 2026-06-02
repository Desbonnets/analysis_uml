package com.example.analysisservice.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Parsed from analysis.yml / analysis.yaml / analysis.json at the root of a ZIP upload.
 *
 * Example:
 * <pre>
 * exclude:
 *   - vendor/
 *   - dist/
 *   - coverage/
 * </pre>
 */
@Data
public class AnalysisConfig {
    private List<String> exclude = new ArrayList<>();
}
