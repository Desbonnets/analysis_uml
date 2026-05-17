package com.example.diagramservice.service;

import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.dto.DependencyGraphDto;
import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DependencyGraphService {

    private final AnalysisClient analysisClient;

    public DependencyGraphDto generate(Long projectId, String recordId, String authHeader) {
        if (recordId == null) {
            recordId = resolveLatestRecordId(projectId, authHeader);
        }

        AnalysisRecord record = analysisClient.getRecord(projectId, recordId, authHeader);

        List<DiagramNode> nodes = new ArrayList<>();
        List<DiagramEdge> edges = new ArrayList<>();
        Set<String> seenEdges = new HashSet<>();

        for (CodeUnit cu : record.getCodeUnits()) {
            String pkg = cu.getPackageName() != null ? cu.getPackageName() : "";
            for (ClassDef c : cu.getClasses()) {
                nodes.add(DiagramNode.builder()
                        .id(c.getQualifiedName())
                        .name(c.getName())
                        .qualifiedName(c.getQualifiedName())
                        .type(c.getType())
                        .packageName(pkg)
                        .fields(List.of())
                        .methods(List.of())
                        .build());

                for (String dep : c.getDependencies()) {
                    if (dep != null && !dep.equals(c.getQualifiedName())) {
                        String key = c.getQualifiedName() + "->" + dep;
                        if (seenEdges.add(key)) {
                            edges.add(DiagramEdge.builder()
                                    .from(c.getQualifiedName())
                                    .to(dep)
                                    .type("USES")
                                    .build());
                        }
                    }
                }
            }
        }

        return DependencyGraphDto.builder()
                .projectId(projectId)
                .recordId(recordId)
                .generatedAt(LocalDateTime.now())
                .nodes(nodes)
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
