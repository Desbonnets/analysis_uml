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
public class PackageDiagramDto {
    private Long projectId;
    private String recordId;
    private LocalDateTime generatedAt;
    private List<PackageNode> packages;
    private List<DiagramEdge> edges;
}
