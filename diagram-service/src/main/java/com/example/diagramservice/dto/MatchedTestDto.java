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
public class MatchedTestDto {
    private String className;
    private String methodName;
    private String confidence;        // CONFIRMED | HEURISTIC
    private List<String> matchedKeywords; // only set for HEURISTIC matches
}
