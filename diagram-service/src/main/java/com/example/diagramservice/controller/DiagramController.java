package com.example.diagramservice.controller;

import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.ConformanceReportDto;
import com.example.diagramservice.dto.ConformanceRequest;
import com.example.diagramservice.dto.DependencyGraphDto;
import com.example.diagramservice.dto.MetricsDto;
import com.example.diagramservice.dto.PackageDiagramDto;
import com.example.diagramservice.dto.ParsePlantUmlRequest;
import com.example.diagramservice.dto.PlantUmlExportDto;
import com.example.diagramservice.dto.PlantUmlRenderDto;
import com.example.diagramservice.dto.TestCoverageReportDto;
import com.example.diagramservice.dto.TestCoverageRequest;
import com.example.diagramservice.service.ClassDiagramService;
import com.example.diagramservice.service.ConformanceService;
import com.example.diagramservice.service.DependencyGraphService;
import com.example.diagramservice.service.MetricsService;
import com.example.diagramservice.service.PackageDiagramService;
import com.example.diagramservice.service.PlantUmlExportService;
import com.example.diagramservice.service.PlantUmlRenderService;
import com.example.diagramservice.service.TestCoverageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final ConformanceService conformanceService;
    private final PlantUmlRenderService plantUmlRenderService;
    private final PlantUmlExportService plantUmlExportService;
    private final TestCoverageService testCoverageService;

    @GetMapping("/{projectId}/class")
    public ResponseEntity<ClassDiagramDto> getClassDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String packageContains,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(classDiagramService.generate(projectId, recordId, filter, types, packageContains, authHeader));
    }

    @GetMapping("/{projectId}/class/export")
    public ResponseEntity<PlantUmlExportDto> exportClassDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String packageContains,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(plantUmlExportService.exportClassDiagram(projectId, recordId, filter, types, packageContains, authHeader));
    }

    @GetMapping("/{projectId}/dependencies")
    public ResponseEntity<DependencyGraphDto> getDependencyGraph(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(dependencyGraphService.generate(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/dependencies/export")
    public ResponseEntity<PlantUmlExportDto> exportDependencyGraph(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(plantUmlExportService.exportDependencyGraph(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/packages")
    public ResponseEntity<PackageDiagramDto> getPackageDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(packageDiagramService.generate(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/packages/export")
    public ResponseEntity<PlantUmlExportDto> exportPackageDiagram(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(plantUmlExportService.exportPackageDiagram(projectId, recordId, authHeader));
    }

    @GetMapping("/{projectId}/metrics")
    public ResponseEntity<MetricsDto> getMetrics(
            @PathVariable Long projectId,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(metricsService.getMetrics(projectId, authHeader));
    }

    @PostMapping("/{projectId}/conformance")
    public ResponseEntity<ConformanceReportDto> checkConformance(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String types,
            @RequestParam(required = false) String packageContains,
            @RequestParam(required = false, defaultValue = "false") boolean checkFields,
            @RequestParam(required = false, defaultValue = "false") boolean checkMethods,
            @RequestBody ConformanceRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(conformanceService.generate(
                projectId, recordId, request.getSource(), filter, types, packageContains,
                checkFields, checkMethods, authHeader));
    }

    @PostMapping("/{projectId}/test-coverage")
    public ResponseEntity<TestCoverageReportDto> checkTestCoverage(
            @PathVariable Long projectId,
            @RequestParam(required = false) String recordId,
            @RequestBody TestCoverageRequest request,
            @RequestHeader("Authorization") String authHeader) {
        return ResponseEntity.ok(testCoverageService.generate(
                projectId, recordId, request.getRequirements(), authHeader));
    }

    @PostMapping("/render-plantuml")
    public ResponseEntity<PlantUmlRenderDto> renderPlantUml(@RequestBody ParsePlantUmlRequest request) {
        return ResponseEntity.ok(plantUmlRenderService.render(request.getSource()));
    }
}
