package com.example.analysisservice.parser.cpp;

import com.example.analysisservice.model.*;
import com.example.analysisservice.parser.LanguageParser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

@Slf4j
@Component
public class CppLanguageParser implements LanguageParser {

    private static final Pattern INCLUDE_RE = Pattern.compile(
            "#include\\s+[<\"]([^>\"]+)[>\"]"
    );
    private static final Pattern NAMESPACE_RE = Pattern.compile(
            "(?m)^[ \\t]*namespace\\s+(\\w+)\\s*\\{"
    );
    // class/struct Name [: [public|private|protected] Base, ...] {
    private static final Pattern CLASS_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:template\\s*<[^>\\n]*>\\s*)?(?:class|struct)\\s+(\\w+)" +
            "(?:\\s*:\\s*([^{\\n]+))?\\s*\\{"
    );
    // Visibility section label
    private static final Pattern VISIBILITY_RE = Pattern.compile(
            "(?m)^[ \\t]*(public|private|protected)\\s*:"
    );
    // Method: word before ( that isn't a keyword, followed by (params) and ending with { ; or =0
    private static final Pattern METHOD_NAME_RE = Pattern.compile(
            "(?:~?(\\w+))\\s*\\("
    );

    private static final Set<String> CPP_KEYWORDS = Set.of(
            "if", "else", "for", "while", "do", "switch", "case", "return",
            "break", "continue", "goto", "default", "namespace", "template",
            "typename", "using", "typedef", "sizeof", "new", "delete",
            "try", "catch", "throw", "operator", "explicit", "virtual",
            "override", "final", "public", "private", "protected",
            "class", "struct", "union", "enum", "nullptr"
    );
    private static final Set<String> CPP_PRIMITIVES = Set.of(
            "int", "char", "long", "short", "float", "double", "void", "bool",
            "unsigned", "signed", "size_t", "string", "auto", "wchar_t"
    );

    @Override
    public Language getLanguage() {
        return Language.CPP;
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
        // Strip single-line comments to reduce false matches
        String stripped = source.replaceAll("//[^\n]*", "");

        String packageName = extractNamespace(stripped);
        return CodeUnit.builder()
                .fileName(filename)
                .packageName(packageName)
                .language(Language.CPP)
                .imports(extractIncludes(stripped))
                .classes(extractClasses(stripped))
                .build();
    }

    private List<String> extractIncludes(String source) {
        List<String> includes = new ArrayList<>();
        Matcher m = INCLUDE_RE.matcher(source);
        while (m.find()) includes.add(m.group(1));
        return includes;
    }

    private String extractNamespace(String source) {
        Matcher m = NAMESPACE_RE.matcher(source);
        return m.find() ? m.group(1) : "";
    }

    private List<ClassDef> extractClasses(String source) {
        List<ClassDef> classes = new ArrayList<>();
        Matcher cm = CLASS_RE.matcher(source);

        while (cm.find()) {
            String name = cm.group(1);
            if (CPP_KEYWORDS.contains(name)) continue;

            List<String> bases = parseInheritance(cm.group(2));
            String superClass = bases.isEmpty() ? null : bases.get(0);
            List<String> ifaces = bases.size() > 1 ? bases.subList(1, bases.size()) : List.of();

            String body = extractBody(source, cm.end() - 1);
            List<MethodDef> methods = extractMethods(body);
            List<FieldDef> fields = extractFields(body);

            classes.add(ClassDef.builder()
                    .name(name)
                    .qualifiedName(name)
                    .type(ClassType.CLASS)
                    .visibility("public")
                    .superClass(superClass)
                    .interfaces(ifaces)
                    .methods(methods)
                    .fields(fields)
                    .dependencies(buildDeps(name, fields, methods))
                    .build());
        }
        return classes;
    }

    private List<MethodDef> extractMethods(String body) {
        List<MethodDef> methods = new ArrayList<>();
        String currentVis = "private"; // default visibility for class

        for (String line : body.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            Matcher vm = VISIBILITY_RE.matcher(line);
            if (vm.find()) {
                currentVis = vm.group(1);
                continue;
            }

            // Method lines contain '(' and end with '{', ';', or '= 0'
            if (!trimmed.contains("(")) continue;
            if (!trimmed.endsWith("{") && !trimmed.endsWith(";")
                    && !trimmed.endsWith("0") && !trimmed.endsWith("delete") && !trimmed.endsWith("default")) {
                continue;
            }

            // Extract method name: the word immediately before '('
            Matcher nm = METHOD_NAME_RE.matcher(trimmed);
            String methodName = null;
            while (nm.find()) methodName = nm.group(1); // take last match before first '('
            // More precisely: find the first occurrence
            nm.reset();
            if (nm.find()) methodName = nm.group(1);

            if (methodName == null || methodName.isBlank() || CPP_KEYWORDS.contains(methodName)) continue;

            // Extract params (everything between first '(' and matching ')')
            int parenOpen = trimmed.indexOf('(');
            int parenClose = trimmed.indexOf(')', parenOpen);
            List<String> params = parenClose > parenOpen
                    ? parseCppParams(trimmed.substring(parenOpen + 1, parenClose))
                    : List.of();

            methods.add(MethodDef.builder()
                    .name(methodName)
                    .returnType("void")
                    .visibility(currentVis)
                    .parameterTypes(params)
                    .isStatic(trimmed.contains("static "))
                    .isAbstract(trimmed.contains("= 0"))
                    .build());
        }
        return methods;
    }

    private List<FieldDef> extractFields(String body) {
        List<FieldDef> fields = new ArrayList<>();
        String currentVis = "private";

        for (String line : body.split("\\r?\\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;

            Matcher vm = VISIBILITY_RE.matcher(line);
            if (vm.find()) {
                currentVis = vm.group(1);
                continue;
            }

            // Skip lines with '(' — those are methods
            if (trimmed.contains("(")) continue;
            // Must end with ';' and not be a preprocessor directive
            if (!trimmed.endsWith(";") || trimmed.startsWith("#")) continue;

            // tokenize: last token before ';' is the field name, everything before is the type
            String withoutSemicolon = trimmed.substring(0, trimmed.length() - 1).trim();
            // Remove array suffix like [10]
            withoutSemicolon = withoutSemicolon.replaceAll("\\[[^]]*]", "").trim();

            String[] tokens = withoutSemicolon.split("\\s+");
            if (tokens.length < 2) continue;

            String fieldName = tokens[tokens.length - 1].replace("*", "").replace("&", "").trim();
            String fieldType = String.join(" ", Arrays.copyOf(tokens, tokens.length - 1))
                    .replace("static", "").replace("mutable", "").replace("const", "").trim();

            if (fieldName.isBlank() || CPP_KEYWORDS.contains(fieldName)) continue;

            fields.add(FieldDef.builder()
                    .name(fieldName)
                    .type(fieldType)
                    .visibility(currentVis)
                    .isStatic(trimmed.contains("static "))
                    .isFinal(trimmed.contains("const "))
                    .build());
        }
        return fields;
    }

    private List<String> buildDeps(String className, List<FieldDef> fields, List<MethodDef> methods) {
        Set<String> deps = new LinkedHashSet<>();
        fields.forEach(f -> deps.add(clean(f.getType())));
        methods.forEach(m -> m.getParameterTypes().forEach(p -> deps.add(clean(p))));
        return deps.stream()
                .filter(d -> !d.isBlank())
                .filter(d -> !CPP_PRIMITIVES.contains(d))
                .filter(d -> !CPP_KEYWORDS.contains(d))
                .filter(d -> !d.equals(className))
                .distinct()
                .toList();
    }

    private List<String> parseInheritance(String basesStr) {
        if (basesStr == null || basesStr.isBlank()) return List.of();
        List<String> result = new ArrayList<>();
        for (String part : basesStr.split(",")) {
            String[] tokens = part.trim().split("\\s+");
            String base = tokens[tokens.length - 1].trim();
            int lt = base.indexOf('<');
            if (lt >= 0) base = base.substring(0, lt);
            if (!base.isBlank() && !CPP_KEYWORDS.contains(base)) result.add(base);
        }
        return result;
    }

    private List<String> parseCppParams(String paramsStr) {
        if (paramsStr == null || paramsStr.isBlank()) return List.of();
        List<String> types = new ArrayList<>();
        for (String param : paramsStr.split(",")) {
            String trimmed = param.trim().replaceAll("[*&]", " ").trim();
            if (trimmed.isEmpty()) continue;
            String[] tokens = trimmed.split("\\s+");
            // Type is everything except the last token (the param name)
            if (tokens.length >= 2) {
                String type = clean(String.join(" ", Arrays.copyOf(tokens, tokens.length - 1)));
                if (!type.isBlank()) types.add(type);
            }
        }
        return types;
    }

    private String clean(String type) {
        return type.replace("*", "").replace("&", "")
                .replace("const ", "").replace("static ", "").trim();
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
