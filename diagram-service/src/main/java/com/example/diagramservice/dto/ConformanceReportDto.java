package com.example.diagramservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConformanceReportDto {
    private Long projectId;
    private String recordId;
    private int expectedClassCount;
    private int actualClassCount;
    private int errorCount;
    private int infoCount;
    private List<ConformanceViolation> violations;
}
