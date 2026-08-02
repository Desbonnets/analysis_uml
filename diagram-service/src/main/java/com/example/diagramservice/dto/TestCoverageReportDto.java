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
public class TestCoverageReportDto {
    private Long projectId;
    private String recordId;
    private int requirementCount;
    private int coveredCount;
    private int uncoveredCount;
    private List<RequirementCoverageDto> coverage;
    private int orphanTestCount;
    private List<MatchedTestDto> orphanTests; // tests detected in the code, matched to no requirement
}
