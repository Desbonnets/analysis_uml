package com.example.diagramservice.controller;

import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.DependencyGraphDto;
import com.example.diagramservice.dto.MetricsDto;
import com.example.diagramservice.dto.PackageDiagramDto;
import com.example.diagramservice.service.ClassDiagramService;
import com.example.diagramservice.service.DependencyGraphService;
import com.example.diagramservice.service.MetricsService;
import com.example.diagramservice.service.PackageDiagramService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/diagrams")
@RequiredArgsConstructor
public class DiagramController {

    private final ClassDiagramService classDiagramService;
    private final DependencyGraphService dependencyGraphService;
    private final PackageDiagramService packageDiagramService;
    private final MetricsService metricsService;

    @GetMapping("/{projectId}/class")
    public ResponseEntity<ClassDiagramDto> getClassDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(classDiagramService.generate(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/dependencies")
    public ResponseEntity<DependencyGraphDto> getDependencyGraph(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(dependencyGraphService.generate(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/packages")
    public ResponseEntity<PackageDiagramDto> getPackageDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(packageDiagramService.generate(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/metrics")
    public ResponseEntity<MetricsDto> getMetrics(
            @PathVariable Long projectId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(metricsService.getMetrics(projectId, authHeader));
    }
}
