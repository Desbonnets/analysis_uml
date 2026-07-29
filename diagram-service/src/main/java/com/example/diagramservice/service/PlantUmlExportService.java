package com.example.diagramservice.service;

import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.DependencyGraphDto;
import com.example.diagramservice.dto.PackageDiagramDto;
import com.example.diagramservice.dto.PlantUmlExportDto;
import com.example.diagramservice.plantuml.PlantUmlExporter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PlantUmlExportService {

    private final ClassDiagramService classDiagramService;
    private final DependencyGraphService dependencyGraphService;
    private final PackageDiagramService packageDiagramService;
    private final PlantUmlExporter plantUmlExporter;

    public PlantUmlExportDto exportClassDiagram(Long projectId, String recordId, String filter,
                                                 String types, String packageContains, String authHeader) {
        ClassDiagramDto dto = classDiagramService.generate(projectId, recordId, filter, types, packageContains, authHeader);
        return PlantUmlExportDto.builder()
                .recordId(dto.getRecordId())
                .source(plantUmlExporter.exportClassDiagram(dto.getNodes(), dto.getEdges()))
                .build();
    }

    public PlantUmlExportDto exportDependencyGraph(Long projectId, String recordId, String authHeader) {
        DependencyGraphDto dto = dependencyGraphService.generate(projectId, recordId, authHeader);
        return PlantUmlExportDto.builder()
                .recordId(dto.getRecordId())
                .source(plantUmlExporter.exportClassDiagram(dto.getNodes(), dto.getEdges()))
                .build();
    }

    public PlantUmlExportDto exportPackageDiagram(Long projectId, String recordId, String authHeader) {
        PackageDiagramDto dto = packageDiagramService.generate(projectId, recordId, authHeader);
        return PlantUmlExportDto.builder()
                .recordId(dto.getRecordId())
                .source(plantUmlExporter.exportPackageDiagram(dto.getPackages(), dto.getEdges()))
                .build();
    }
}
