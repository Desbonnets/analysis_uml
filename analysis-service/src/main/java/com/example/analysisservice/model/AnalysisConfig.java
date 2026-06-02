package com.example.analysisservice.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Parsed from analysis.yml / analysis.yaml / analysis.json at the root of a ZIP upload.
 *
 * Use either include (whitelist) or exclude (blacklist), or both:
 * <pre>
 * exclude:
 *   - vendor/
 *   - dist/
 *
 * include:
 *   - src/
 *   - lib/
 * </pre>
 */
@Data
public class AnalysisConfig {
    private List<String> include = new ArrayList<>();
    private List<String> exclude = new ArrayList<>();
}
