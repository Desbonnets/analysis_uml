package com.example.analysisservice.parser.c;

import com.example.analysisservice.model.*;
import com.example.analysisservice.parser.LanguageParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

/**
 * Extracts structs from C source files and maps them to ClassDef (UML class).
 * C has no OOP constructs — structs are the closest equivalent.
 */
@Slf4j
@Component
public class CLanguageParser implements LanguageParser {

    private static final Pattern INCLUDE_RE = Pattern.compile(
            "#include\\s+[<\"]([^>\"]+)[>\"]"
    );
    // struct Name {  or  typedef struct [Name] {
    private static final Pattern STRUCT_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:typedef\\s+)?struct\\s*(\\w+)?\\s*\\{"
    );
    // Simple field inside struct: [qualifier] type name[[]]; — no parens (to skip function pointers roughly)
    private static final Pattern FIELD_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(?:const|volatile|unsigned|signed|static)\\s+)*([\\w]+(?:\\s*\\*+)?)\\s+(\\w+)\\s*(?:\\[[^]]*])?\\s*;"
    );

    private static final Set<String> C_KEYWORDS = Set.of(
            "if", "else", "for", "while", "do", "switch", "case", "return",
            "break", "continue", "goto", "default", "sizeof", "NULL",
            "typedef", "extern", "static", "auto", "register", "struct",
            "union", "enum", "const", "volatile", "inline"
    );
    private static final Set<String> C_PRIMITIVES = Set.of(
            "int", "char", "long", "short", "float", "double", "void",
            "unsigned", "signed", "bool", "size_t",
            "uint8_t", "uint16_t", "uint32_t", "uint64_t",
            "int8_t", "int16_t", "int32_t", "int64_t"
    );

    @Override
    public Language getLanguage() {
        return Language.C;
    }

    @Override
    public List<CodeUnit> parse(Map<String, byte[]> files) throws IOException {
        List<CodeUnit> units = new ArrayList<>();
        for (Map.Entry<String, byte[]> entry : files.entrySet()) {
            try {
                String source = new String(entry.getValue(), StandardCharsets.UTF_8);
                units.add(parseFile(entry.getKey(), source));
            } catch (Exception e) {
                log.warn("Cannot parse {}: {}", entry.getKey(), e.getMessage());
            }
        }
        return units;
    }

    private CodeUnit parseFile(String filename, String source) {
        // Strip single-line comments to avoid false matches
        String stripped = source.replaceAll("//[^\n]*", "");

        return CodeUnit.builder()
                .fileName(filename)
                .language(Language.C)
                .imports(extractIncludes(stripped))
                .classes(extractStructs(stripped))
                .build();
    }

    private List<String> extractIncludes(String source) {
        List<String> includes = new ArrayList<>();
        Matcher m = INCLUDE_RE.matcher(source);
        while (m.find()) includes.add(m.group(1));
        return includes;
    }

    private List<ClassDef> extractStructs(String source) {
        List<ClassDef> structs = new ArrayList<>();
        Matcher sm = STRUCT_RE.matcher(source);

        while (sm.find()) {
            String nameBeforeBrace = sm.group(1); // may be null for anonymous structs
            int bodyStart = sm.end() - 1;
            String body = extractBody(source, bodyStart);
            int afterBrace = bodyStart + 1 + body.length() + 1; // position after '}'

            String name = nameBeforeBrace;
            if (name == null) {
                // typedef struct { ... } Alias; — look for the alias token after '}'
                Matcher aliasMatcher = Pattern.compile("^\\s*(\\w+)\\s*;").matcher(
                        source.substring(Math.min(afterBrace, source.length()))
                );
                if (aliasMatcher.find()) name = aliasMatcher.group(1);
            }

            if (name == null || name.isBlank() || C_KEYWORDS.contains(name)) continue;

            final String structName = name;
            List<FieldDef> fields = extractFields(body);
            structs.add(ClassDef.builder()
                    .name(structName)
                    .qualifiedName(structName)
                    .type(ClassType.CLASS)
                    .visibility("public")
                    .fields(fields)
                    .dependencies(fields.stream()
                            .map(f -> f.getType().replace("*", "").trim())
                            .filter(t -> !t.isBlank() && !C_PRIMITIVES.contains(t) && !t.equals(structName))
                            .distinct().toList())
                    .build());
        }
        return structs;
    }

    private List<FieldDef> extractFields(String body) {
        // Skip lines with '(' to avoid function-pointer fields that would confuse the regex
        String filteredBody = Arrays.stream(body.split("\n"))
                .filter(l -> !l.contains("("))
                .reduce("", (a, b) -> a + "\n" + b);

        List<FieldDef> fields = new ArrayList<>();
        Matcher m = FIELD_RE.matcher(filteredBody);
        while (m.find()) {
            String type = m.group(1).trim();
            String name = m.group(2);
            if (C_KEYWORDS.contains(name)) continue;
            fields.add(FieldDef.builder()
                    .name(name).type(type)
                    .visibility("public").isStatic(false).isFinal(false)
                    .build());
        }
        return fields;
    }

    private String extractBody(String source, int openBracePos) {
        int depth = 0;
        for (int i = openBracePos; i < source.length(); i++) {
            char c = source.charAt(i);
            if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) return source.substring(openBracePos + 1, i);
            }
        }
        return source.substring(openBracePos + 1);
    }
}
