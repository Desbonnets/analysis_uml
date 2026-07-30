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
 *  - field/method matching is by name (methods: name + parameter types) — no
 *    disambiguation beyond that in case of overloads.
 *
 * Field/method checking is opt-in via checkFields/checkMethods (default false, so existing
 * reference diagrams don't suddenly report a wave of violations) and only applies to reference
 * classes whose body was actually written (`class Foo { ... }`) — a reference class without a
 * body is treated as "structure only, members not specified", not "must have zero members".
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
        return generate(projectId, recordId, source, filter, types, packageContains, false, false, authHeader);
    }

    public ConformanceReportDto generate(Long projectId, String recordId, String source,
                                          String filter, String types, String packageContains,
                                          boolean checkFields, boolean checkMethods, String authHeader) {
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

            if (checkFields && expected.fields().containsKey(name)) {
                violations.addAll(diffFields(name, expected.fields().get(name), actualNode.getFields()));
            }
            if (checkMethods && expected.methods().containsKey(name)) {
                violations.addAll(diffMethods(name, expected.methods().get(name), actualNode.getMethods()));
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

    private List<ConformanceViolation> diffFields(String className, List<PlantUmlParser.FieldDecl> expectedFields,
                                                   List<String> actualFieldLines) {
        Map<String, String> expectedByName = new LinkedHashMap<>();
        for (PlantUmlParser.FieldDecl f : expectedFields) expectedByName.put(f.name(), f.type());

        Map<String, String> actualByName = new LinkedHashMap<>();
        if (actualFieldLines != null) {
            for (String line : actualFieldLines) {
                plantUmlParser.parseField(line).ifPresent(f -> actualByName.put(f.name(), f.type()));
            }
        }

        List<ConformanceViolation> result = new ArrayList<>();
        for (Map.Entry<String, String> e : expectedByName.entrySet()) {
            String actualType = actualByName.get(e.getKey());
            if (actualType == null) {
                result.add(ConformanceViolation.builder()
                        .severity("ERROR").type("FIELD_MISSING")
                        .className(className).memberName(e.getKey())
                        .message("Attribut manquant : " + className + "." + e.getKey() + " (" + e.getValue() + ")")
                        .build());
            } else if (!actualType.equals(e.getValue())) {
                result.add(ConformanceViolation.builder()
                        .severity("ERROR").type("FIELD_TYPE_MISMATCH")
                        .className(className).memberName(e.getKey())
                        .message("Type d'attribut incorrect pour " + className + "." + e.getKey()
                                + " (attendu " + e.getValue() + ", trouvé " + actualType + ")")
                        .build());
            }
        }
        for (String name : actualByName.keySet()) {
            if (!expectedByName.containsKey(name)) {
                result.add(ConformanceViolation.builder()
                        .severity("INFO").type("EXTRA_FIELD")
                        .className(className).memberName(name)
                        .message("Attribut non référencé dans le diagramme de référence : " + className + "." + name)
                        .build());
            }
        }
        return result;
    }

    private List<ConformanceViolation> diffMethods(String className, List<PlantUmlParser.MethodDecl> expectedMethods,
                                                     List<String> actualMethodLines) {
        Map<String, PlantUmlParser.MethodDecl> expectedByKey = new LinkedHashMap<>();
        for (PlantUmlParser.MethodDecl m : expectedMethods) expectedByKey.put(methodKey(m.name(), m.paramTypes()), m);

        Map<String, PlantUmlParser.MethodDecl> actualByKey = new LinkedHashMap<>();
        if (actualMethodLines != null) {
            for (String line : actualMethodLines) {
                plantUmlParser.parseMethod(line)
                        .ifPresent(m -> actualByKey.put(methodKey(m.name(), m.paramTypes()), m));
            }
        }

        List<ConformanceViolation> result = new ArrayList<>();
        for (Map.Entry<String, PlantUmlParser.MethodDecl> e : expectedByKey.entrySet()) {
            PlantUmlParser.MethodDecl expected = e.getValue();
            PlantUmlParser.MethodDecl actualMethod = actualByKey.get(e.getKey());
            String signature = expected.name() + "(" + String.join(", ", expected.paramTypes()) + ")";
            if (actualMethod == null) {
                result.add(ConformanceViolation.builder()
                        .severity("ERROR").type("METHOD_MISSING")
                        .className(className).memberName(expected.name())
                        .message("Méthode manquante : " + className + "." + signature + ": " + expected.returnType())
                        .build());
            } else if (!actualMethod.returnType().equals(expected.returnType())) {
                result.add(ConformanceViolation.builder()
                        .severity("ERROR").type("METHOD_SIGNATURE_MISMATCH")
                        .className(className).memberName(expected.name())
                        .message("Type de retour incorrect pour " + className + "." + signature
                                + " (attendu " + expected.returnType() + ", trouvé " + actualMethod.returnType() + ")")
                        .build());
            }
        }
        for (Map.Entry<String, PlantUmlParser.MethodDecl> e : actualByKey.entrySet()) {
            if (!expectedByKey.containsKey(e.getKey())) {
                PlantUmlParser.MethodDecl m = e.getValue();
                result.add(ConformanceViolation.builder()
                        .severity("INFO").type("EXTRA_METHOD")
                        .className(className).memberName(m.name())
                        .message("Méthode non référencée dans le diagramme de référence : " + className + "."
                                + m.name() + "(" + String.join(", ", m.paramTypes()) + ")")
                        .build());
            }
        }
        return result;
    }

    private String methodKey(String name, List<String> paramTypes) {
        return name + "(" + String.join(",", paramTypes) + ")";
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
