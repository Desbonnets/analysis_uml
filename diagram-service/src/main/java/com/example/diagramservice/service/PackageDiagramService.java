package com.example.diagramservice.service;

import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.PackageDiagramDto;
import com.example.diagramservice.dto.PackageNode;
import com.example.diagramservice.model.AnalysisHistoryEntry;
import com.example.diagramservice.model.AnalysisRecord;
import com.example.diagramservice.model.ClassDef;
import com.example.diagramservice.model.CodeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PackageDiagramService {

    private final AnalysisClient analysisClient;

    public PackageDiagramDto generate(Long projectId, String recordId, String authHeader) {
        if (recordId == null) {
            recordId = resolveLatestRecordId(projectId, authHeader);
        }

        AnalysisRecord record = analysisClient.getRecord(projectId, recordId, authHeader);

        // Map: qualifiedName → packageName (for all internal classes)
        Map<String, String> classToPackage = new HashMap<>();
        // Map: packageName → list of class names
        Map<String, List<String>> packageToClasses = new HashMap<>();
        // Map: packageName → set of dependency packageNames
        Map<String, Set<String>> packageDeps = new HashMap<>();

        for (CodeUnit cu : record.getCodeUnits()) {
            String pkg = cu.getPackageName() != null ? cu.getPackageName() : "(default)";
            for (ClassDef c : cu.getClasses()) {
                classToPackage.put(c.getQualifiedName(), pkg);
                packageToClasses.computeIfAbsent(pkg, k -> new ArrayList<>()).add(c.getName());
                packageDeps.computeIfAbsent(pkg, k -> new HashSet<>());
            }
        }

        // Resolve inter-package dependencies
        for (CodeUnit cu : record.getCodeUnits()) {
            String sourcePkg = cu.getPackageName() != null ? cu.getPackageName() : "(default)";
            for (ClassDef c : cu.getClasses()) {
                for (String dep : c.getDependencies()) {
                    String targetPkg = classToPackage.get(dep);
                    if (targetPkg != null && !targetPkg.equals(sourcePkg)) {
                        packageDeps.get(sourcePkg).add(targetPkg);
                    }
                }
            }
        }

        List<PackageNode> packages = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : packageToClasses.entrySet()) {
            String pkg = entry.getKey();
            packages.add(PackageNode.builder()
                    .name(pkg)
                    .classCount(entry.getValue().size())
                    .classes(entry.getValue())
                    .dependsOn(new ArrayList<>(packageDeps.getOrDefault(pkg, Set.of())))
                    .build());
        }

        List<DiagramEdge> edges = new ArrayList<>();
        Set<String> seenEdges = new HashSet<>();
        for (Map.Entry<String, Set<String>> entry : packageDeps.entrySet()) {
            for (String target : entry.getValue()) {
                String key = entry.getKey() + "->" + target;
                if (seenEdges.add(key)) {
                    edges.add(DiagramEdge.builder()
                            .from(entry.getKey())
                            .to(target)
                            .type("DEPENDS_ON")
                            .build());
                }
            }
        }

        return PackageDiagramDto.builder()
                .projectId(projectId)
                .recordId(recordId)
                .generatedAt(LocalDateTime.now())
                .packages(packages)
                .edges(edges)
                .build();
    }

    private String resolveLatestRecordId(Long projectId, String authHeader) {
        List<AnalysisHistoryEntry> history = analysisClient.getHistory(projectId, authHeader);
        if (history == null || history.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No analysis found for project " + projectId);
        }
        return history.get(0).getRecordId();
    }
}
