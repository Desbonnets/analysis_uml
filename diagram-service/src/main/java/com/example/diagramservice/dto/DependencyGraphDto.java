package com.example.diagramservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyGraphDto {
    private Long projectId;
    private String recordId;
    private LocalDateTime generatedAt;
    private List<DiagramNode> nodes;
    private List<DiagramEdge> edges;
}
