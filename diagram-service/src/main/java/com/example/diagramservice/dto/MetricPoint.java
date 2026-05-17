package com.example.diagramservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricPoint {
    private String recordId;
    private String analyzedAt;
    private String projectName;
    private int filesAnalyzed;
    private int classesFound;
}
