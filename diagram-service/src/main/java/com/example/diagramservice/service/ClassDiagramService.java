package com.example.diagramservice.service;

import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
import com.example.diagramservice.model.AnalysisHistoryEntry;
import com.example.diagramservice.model.AnalysisRecord;
import com.example.diagramservice.model.ClassDef;
import com.example.diagramservice.model.CodeUnit;
import com.example.diagramservice.model.OrmRelation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClassDiagramService {

    private final AnalysisClient analysisClient;

    public ClassDiagramDto generate(Long projectId, String recordId, String authHeader) {
        if (recordId == null) {
            recordId = resolveLatestRecordId(projectId, authHeader);
        }

        AnalysisRecord record = analysisClient.getRecord(projectId, recordId, authHeader);

        Set<String> internalClasses = new HashSet<>();
        for (CodeUnit cu : record.getCodeUnits()) {
            for (ClassDef c : cu.getClasses()) {
                if (c.getQualifiedName() != null) {
                    internalClasses.add(c.getQualifiedName());
                }
            }
        }

        List<DiagramNode> nodes = new ArrayList<>();
        List<DiagramEdge> edges = new ArrayList<>();

        for (CodeUnit cu : record.getCodeUnits()) {
            for (ClassDef c : cu.getClasses()) {
                nodes.add(buildNode(c, cu.getPackageName()));

                if (c.getSuperClass() != null && !c.getSuperClass().isBlank()) {
                    edges.add(DiagramEdge.builder()
                            .from(c.getQualifiedName())
                            .to(c.getSuperClass())
                            .type("EXTENDS")
                            .build());
                }

                for (String iface : c.getInterfaces()) {
                    edges.add(DiagramEdge.builder()
                            .from(c.getQualifiedName())
                            .to(iface)
                            .type("IMPLEMENTS")
                            .build());
                }

                for (String dep : c.getDependencies()) {
                    if (internalClasses.contains(dep) && !dep.equals(c.getQualifiedName())) {
                        edges.add(DiagramEdge.builder()
                                .from(c.getQualifiedName())
                                .to(dep)
                                .type("USES")
                                .build());
                    }
                }

                if (c.getOrmRelations() != null) {
                    for (OrmRelation rel : c.getOrmRelations()) {
                        String targetQn = resolveQualifiedName(rel.getTargetEntity(), internalClasses);
                        if (targetQn != null && !targetQn.equals(c.getQualifiedName())) {
                            edges.add(DiagramEdge.builder()
                                    .from(c.getQualifiedName())
                                    .to(targetQn)
                                    .type(rel.getRelationType())
                                    .build());
                        }
                    }
                }
            }
        }

        return ClassDiagramDto.builder()
                .projectId(projectId)
                .recordId(recordId)
                .generatedAt(LocalDateTime.now())
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    private DiagramNode buildNode(ClassDef c, String packageName) {
        List<String> fields = c.getFields().stream()
                .map(f -> formatVisibility(f.getVisibility()) + " " + f.getName() + ": " + f.getType())
                .collect(Collectors.toList());

        List<String> methods = c.getMethods().stream()
                .map(m -> formatVisibility(m.getVisibility()) + " " + m.getName()
                        + "(" + String.join(", ", m.getParameterTypes()) + "): " + m.getReturnType())
                .collect(Collectors.toList());

        String pkg = packageName != null ? packageName : extractPackage(c.getQualifiedName());

        return DiagramNode.builder()
                .id(c.getQualifiedName())
                .name(c.getName())
                .qualifiedName(c.getQualifiedName())
                .type(c.getType())
                .packageName(pkg)
                .fields(fields)
                .methods(methods)
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

    private String formatVisibility(String visibility) {
        if (visibility == null) return "~";
        return switch (visibility.toLowerCase()) {
            case "public" -> "+";
            case "private" -> "-";
            case "protected" -> "#";
            default -> "~";
        };
    }

    private String extractPackage(String qualifiedName) {
        if (qualifiedName == null) return "";
        int last = qualifiedName.lastIndexOf('.');
        return last > 0 ? qualifiedName.substring(0, last) : "";
    }

    // Resolves a simple class name (e.g. "Category") to its qualified name
    // (e.g. "App.Entity.Category") by scanning the set of known internal classes.
    private String resolveQualifiedName(String simpleName, Set<String> internalClasses) {
        if (simpleName == null) return null;
        if (internalClasses.contains(simpleName)) return simpleName;
        return internalClasses.stream()
                .filter(qn -> qn.equals(simpleName) || qn.endsWith("." + simpleName))
                .findFirst()
                .orElse(null);
    }
}
