package com.example.diagramservice.plantuml;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal PlantUML class-diagram parser used for architecture conformance checks.
 * Regex, line-by-line, unrecognized lines are skipped — same low-ceremony style as the
 * analysis-service language parsers, and no external PlantUML library dependency.
 *
 * Deliberately out of scope for v1:
 *  - reversed relation arrows (only "A --|> B" is supported, not "B <|-- A")
 *  - class body members: fields/methods inside `{ ... }` are ignored, no member-level diff
 *  - the `annotation` keyword — RECORD/ANNOTATION ClassType values can't be authored here
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

    public ParsedDiagram parse(String source) {
        Map<String, String> classTypes = new LinkedHashMap<>();
        Map<String, String> aliasToName = new HashMap<>();
        List<ParsedRelation> relations = new ArrayList<>();

        String[] lines = source.split("\\r?\\n");

        for (String line : lines) {
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
        }

        for (String line : lines) {
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

        return new ParsedDiagram(classTypes, relations);
    }

    public record ParsedDiagram(Map<String, String> classTypes, List<ParsedRelation> relations) {
    }

    public record ParsedRelation(String from, String to, String kind) {
    }
}
