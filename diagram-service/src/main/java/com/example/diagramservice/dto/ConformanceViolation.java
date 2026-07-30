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
    // MISSING_CLASS | TYPE_MISMATCH | MISSING_RELATION | EXTRA_CLASS |
    // FIELD_MISSING | FIELD_TYPE_MISMATCH | EXTRA_FIELD |
    // METHOD_MISSING | METHOD_SIGNATURE_MISMATCH | EXTRA_METHOD
    private String type;
    private String className;
    private String relatedClassName;
    private String memberName;      // field/method name, only set for member-level violations
    private String message;
}
