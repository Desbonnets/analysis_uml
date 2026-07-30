package com.example.diagramservice.plantuml;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal PlantUML class-diagram parser used for architecture conformance checks.
 * Regex, line-by-line, unrecognized lines are skipped — same low-ceremony style as the
 * analysis-service language parsers, and no external PlantUML library dependency.
 *
 * Deliberately out of scope:
 *  - reversed relation arrows (only "A --|> B" is supported, not "B <|-- A")
 *  - the `annotation` keyword — RECORD/ANNOTATION ClassType values can't be authored here
 *  - class body must open on the same line as the declaration ("class Foo {", not "class Foo\n{")
 *  - exceptions/throws on methods — see diagram-service/docs/conformance-precision.md
 */
@Component
public class PlantUmlParser {

    private static final Pattern DECLARATION_RE = Pattern.compile(
            "^\\s*(abstract\\s+class|class|interface|enum)\\s+\"?([\\w.]+)\"?(?:\\s+as\\s+(\\w+))?"
    );

    // Longest/most specific arrow tokens first so e.g. "--|>" isn't swallowed by a bare "--" match.
    private static final Pattern RELATION_RE = Pattern.compile(
            "^\\s*\"?([\\w.]+)\"?\\s*(?:\"[^\"]*\"\\s*)?" +
            "(--\\|>|\\.\\.\\|>|\\*--|--\\*|o--|--o|-->|\\.\\.>|--|\\.\\.)" +
            "\\s*(?:\"[^\"]*\"\\s*)?\"?([\\w.]+)\"?"
    );

    // Class body members, same textual convention as ClassDiagramService#buildNode:
    // "+ name: Type" for fields, "+ name(Type1, Type2): ReturnType" for methods.
    private static final Pattern FIELD_RE = Pattern.compile(
            "^\\s*[+\\-#~]?\\s*(\\w+)\\s*:\\s*([\\w<>\\[\\],.]+)\\s*$"
    );
    private static final Pattern METHOD_RE = Pattern.compile(
            "^\\s*[+\\-#~]?\\s*(\\w+)\\s*\\(([^)]*)\\)\\s*:\\s*([\\w<>\\[\\],.]+)\\s*$"
    );

    public ParsedDiagram parse(String source) {
        Map<String, String> classTypes = new LinkedHashMap<>();
        Map<String, String> aliasToName = new HashMap<>();
        Map<String, List<FieldDecl>> fields = new LinkedHashMap<>();
        Map<String, List<MethodDecl>> methods = new LinkedHashMap<>();
        List<ParsedRelation> relations = new ArrayList<>();

        String[] lines = source.split("\\r?\\n");
        boolean[] isBodyLine = new boolean[lines.length];
        String currentClass = null;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];

            if (currentClass != null) {
                isBodyLine[i] = true;
                if (line.contains("}")) {
                    currentClass = null;
                    continue;
                }
                List<FieldDecl> classFields = fields.get(currentClass);
                List<MethodDecl> classMethods = methods.get(currentClass);
                parseField(line).ifPresent(classFields::add);
                parseMethod(line).ifPresent(classMethods::add);
                continue;
            }

            Matcher m = DECLARATION_RE.matcher(line);
            if (!m.find()) continue;

            String type = switch (m.group(1)) {
                case "abstract class" -> "ABSTRACT_CLASS";
                case "interface" -> "INTERFACE";
                case "enum" -> "ENUM";
                default -> "CLASS";
            };
            String name = m.group(2);
            String alias = m.group(3);

            classTypes.put(name, type);
            aliasToName.put(name, name);
            if (alias != null) aliasToName.put(alias, name);

            if (line.contains("{")) {
                currentClass = name;
                fields.put(name, new ArrayList<>());
                methods.put(name, new ArrayList<>());
            }
        }

        for (int i = 0; i < lines.length; i++) {
            if (isBodyLine[i]) continue;
            String line = lines[i];
            if (DECLARATION_RE.matcher(line).find()) continue;

            Matcher m = RELATION_RE.matcher(line);
            if (!m.find()) continue;

            String from = aliasToName.getOrDefault(m.group(1), m.group(1));
            String arrow = m.group(2);
            String to = aliasToName.getOrDefault(m.group(3), m.group(3));
            String kind = arrow.contains("|>")
                    ? (arrow.startsWith("--") ? "EXTENDS" : "IMPLEMENTS")
                    : "ASSOCIATION";

            relations.add(new ParsedRelation(from, to, kind));
        }

        return new ParsedDiagram(classTypes, relations, fields, methods);
    }

    /** Parses a single class-body line as a field ("+ name: Type"). Also reused for the
     * "actual" side, which formats fields identically (see ClassDiagramService#buildNode). */
    public Optional<FieldDecl> parseField(String line) {
        Matcher m = FIELD_RE.matcher(line);
        if (!m.find()) return Optional.empty();
        return Optional.of(new FieldDecl(m.group(1), m.group(2)));
    }

    /** Parses a single class-body line as a method ("+ name(Type1, Type2): ReturnType").
     * Also reused for the "actual" side (see ClassDiagramService#buildNode). */
    public Optional<MethodDecl> parseMethod(String line) {
        Matcher m = METHOD_RE.matcher(line);
        if (!m.find()) return Optional.empty();
        List<String> paramTypes = m.group(2).isBlank()
                ? List.of()
                : Arrays.stream(m.group(2).split(",")).map(String::trim).toList();
        return Optional.of(new MethodDecl(m.group(1), paramTypes, m.group(3)));
    }

    public record ParsedDiagram(Map<String, String> classTypes, List<ParsedRelation> relations,
                                 Map<String, List<FieldDecl>> fields, Map<String, List<MethodDecl>> methods) {
    }

    public record ParsedRelation(String from, String to, String kind) {
    }

    public record FieldDecl(String name, String type) {
    }

    public record MethodDecl(String name, List<String> paramTypes, String returnType) {
    }
}
