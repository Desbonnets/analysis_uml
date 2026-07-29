package com.example.diagramservice.service;

import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.ConformanceReportDto;
import com.example.diagramservice.dto.ConformanceViolation;
import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
import com.example.diagramservice.plantuml.PlantUmlParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Compares the actual, code-derived class diagram against a hand-written or imported
 * PlantUML "reference" diagram and reports where the real code deviates from it.
 *
 * Known v1 limitations (see PlantUmlParser for the reference-side ones):
 *  - matching is by simple class name, not qualified name — duplicate names across
 *    packages resolve to whichever one is encountered first in the actual diagram.
 *  - only structural conformance (classes present, their type, and their
 *    extends/implements/association relations) is checked — no field/method diffing.
 */
@Service
@RequiredArgsConstructor
public class ConformanceService {

    private final ClassDiagramService classDiagramService;
    private final PlantUmlParser plantUmlParser;

    public ConformanceReportDto generate(Long projectId, String recordId, String source, String authHeader) {
        return generate(projectId, recordId, source, null, null, null, authHeader);
    }

    public ConformanceReportDto generate(Long projectId, String recordId, String source,
                                          String filter, String types, String packageContains, String authHeader) {
        // classDiagramService already resolves recordId==null to the latest analysis
        // and returns the resolved id, so no need to duplicate that lookup here.
        // Filters restrict which actual classes are checked against the reference diagram —
        // e.g. filter=entities to verify only the DB entity subset, not the whole codebase.
        ClassDiagramDto actual = classDiagramService.generate(projectId, recordId, filter, types, packageContains, authHeader);
        PlantUmlParser.ParsedDiagram expected = plantUmlParser.parse(source);

        Map<String, DiagramNode> actualByName = new LinkedHashMap<>();
        Map<String, String> actualNameById = new HashMap<>();
        for (DiagramNode n : actual.getNodes()) {
            actualByName.putIfAbsent(n.getName(), n);
            actualNameById.put(n.getId(), n.getName());
        }

        Set<String> relationKeys = new HashSet<>();
        for (DiagramEdge e : actual.getEdges()) {
            String fromName = actualNameById.getOrDefault(e.getFrom(), simpleName(e.getFrom()));
            String toName = actualNameById.getOrDefault(e.getTo(), simpleName(e.getTo()));
            relationKeys.add(fromName + "|" + toName + "|" + bucketOf(e.getType()));
        }

        List<ConformanceViolation> violations = new ArrayList<>();
        Set<String> missingClasses = new HashSet<>();

        for (Map.Entry<String, String> entry : expected.classTypes().entrySet()) {
            String name = entry.getKey();
            String expectedType = entry.getValue();
            DiagramNode actualNode = actualByName.get(name);

            if (actualNode == null) {
                missingClasses.add(name);
                violations.add(ConformanceViolation.builder()
                        .severity("ERROR")
                        .type("MISSING_CLASS")
                        .className(name)
                        .message("Classe manquante : " + name)
                        .build());
                continue;
            }

            String actualType = actualNode.getType();
            if (actualType == null || !actualType.equalsIgnoreCase(expectedType)) {
                violations.add(ConformanceViolation.builder()
                        .severity("ERROR")
                        .type("TYPE_MISMATCH")
                        .className(name)
                        .message("Type incorrect pour " + name + " (attendu " + expectedType + ", trouvé " + actualType + ")")
                        .build());
            }
        }

        for (PlantUmlParser.ParsedRelation rel : expected.relations()) {
            if (missingClasses.contains(rel.from()) || missingClasses.contains(rel.to())) continue;

            String key = rel.from() + "|" + rel.to() + "|" + rel.kind();
            if (!relationKeys.contains(key)) {
                violations.add(ConformanceViolation.builder()
                        .severity("ERROR")
                        .type("MISSING_RELATION")
                        .className(rel.from())
                        .relatedClassName(rel.to())
                        .message("Relation manquante : " + rel.from() + " -> " + rel.to() + " (" + rel.kind() + ")")
                        .build());
            }
        }

        for (DiagramNode n : actual.getNodes()) {
            if (!expected.classTypes().containsKey(n.getName())) {
                violations.add(ConformanceViolation.builder()
                        .severity("INFO")
                        .type("EXTRA_CLASS")
                        .className(n.getName())
                        .message("Classe non référencée dans le diagramme de référence : " + n.getName())
                        .build());
            }
        }

        long errorCount = violations.stream().filter(v -> "ERROR".equals(v.getSeverity())).count();

        return ConformanceReportDto.builder()
                .projectId(projectId)
                .recordId(actual.getRecordId())
                .expectedClassCount(expected.classTypes().size())
                .actualClassCount(actual.getNodes().size())
                .errorCount((int) errorCount)
                .infoCount(violations.size() - (int) errorCount)
                .violations(violations)
                .build();
    }

    private String bucketOf(String edgeType) {
        if ("EXTENDS".equals(edgeType)) return "EXTENDS";
        if ("IMPLEMENTS".equals(edgeType)) return "IMPLEMENTS";
        return "ASSOCIATION";
    }

    private String simpleName(String qualifiedName) {
        if (qualifiedName == null) return "";
        int last = qualifiedName.lastIndexOf('.');
        return last >= 0 ? qualifiedName.substring(last + 1) : qualifiedName;
    }
}
