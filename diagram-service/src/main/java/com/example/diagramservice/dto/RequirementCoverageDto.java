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
public class RequirementCoverageDto {
    private String requirementId;
    private String title;
    private String status;            // COVERED_CONFIRMED | COVERED_HEURISTIC | UNCOVERED
    private List<MatchedTestDto> matchedTests;
}
