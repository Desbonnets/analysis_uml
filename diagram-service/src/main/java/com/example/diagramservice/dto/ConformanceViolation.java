package com.example.diagramservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConformanceViolation {
    private String severity;        // ERROR | INFO
    private String type;            // MISSING_CLASS | TYPE_MISMATCH | MISSING_RELATION | EXTRA_CLASS
    private String className;
    private String relatedClassName;
    private String message;
}
