package com.example.analysisservice.parser.javascript;

import com.example.analysisservice.model.*;
import com.example.analysisservice.parser.LanguageParser;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

@Slf4j
public abstract class JsRegexParser implements LanguageParser {

    private static final Set<String> PRIMITIVES = Set.of(
            "string", "number", "boolean", "void", "any", "never", "undefined",
            "null", "object", "symbol", "bigint", "unknown"
    );

    private static final Set<String> KEYWORDS = Set.of(
            "if", "else", "for", "while", "do", "switch", "case", "return",
            "try", "catch", "finally", "throw", "new", "delete", "typeof",
            "instanceof", "in", "of", "break", "continue", "yield", "await",
            "function", "var", "let", "const", "import", "export", "from",
            "super", "this", "extends", "implements", "class", "interface"
    );

    // import { X } from 'y' or import X from 'y' or import 'y'
    private static final Pattern IMPORT_RE = Pattern.compile(
            "import\\s+(?:[\\w*{}\\s,]+\\s+from\\s+)?['\"]([^'\"]+)['\"]"
    );

    // class Name [extends Parent] [implements I1, I2] {
    private static final Pattern CLASS_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:export\\s+(?:default\\s+)?)?(?:abstract\\s+)?class\\s+(\\w+)" +
            "(?:\\s+extends\\s+([\\w.]+(?:<[^{>]*>)?))?" +
            "(?:\\s+implements\\s+([\\w\\s,.<>]+?))?" +
            "\\s*\\{"
    );

    // interface Name [extends I1, I2] {   — TypeScript only
    private static final Pattern INTERFACE_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:export\\s+)?interface\\s+(\\w+)" +
            "(?:\\s+extends\\s+([\\w\\s,.<>]+?))?" +
            "\\s*\\{"
    );

    // enum Name {   — TypeScript only
    private static final Pattern ENUM_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:export\\s+)?(?:const\\s+)?enum\\s+(\\w+)\\s*\\{"
    );

    // [modifiers] methodName([params])[: returnType] {
    private static final Pattern METHOD_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(?:public|private|protected|static|async|abstract|override|readonly)\\s+)*" +
            "(?:(?:get|set)\\s+)?(\\w+)\\s*\\(([^)]*)\\)\\s*(?::\\s*[\\w<>\\[\\]|&?., ]+?)?\\s*\\{"
    );

    // [modifiers] fieldName[!][: type][= ...];
    private static final Pattern FIELD_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(public|private|protected)\\s+)?(?:(static)\\s+)?(?:(?:readonly|abstract|declare)\\s+)?" +
            "(\\w+)(?:!\\s*)?(?:\\s*:\\s*([\\w<>\\[\\]|&?. ]+))?" +
            "\\s*(?:=|;)"
    );

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
        return CodeUnit.builder()
                .fileName(filename)
                .language(getLanguage())
                .imports(extractImports(source))
                .classes(extractClasses(source))
                .build();
    }

    private List<String> extractImports(String source) {
        List<String> imports = new ArrayList<>();
        Matcher m = IMPORT_RE.matcher(source);
        while (m.find()) {
            imports.add(m.group(1));
        }
        return imports;
    }

    private List<ClassDef> extractClasses(String source) {
        List<ClassDef> classes = new ArrayList<>();

        Matcher cm = CLASS_RE.matcher(source);
        while (cm.find()) {
            String name = cm.group(1);
            String superClass = cm.group(2) != null ? stripGenerics(cm.group(2)) : null;
            List<String> interfaces = parseList(cm.group(3));
            String body = extractBody(source, cm.end() - 1);
            List<MethodDef> methods = extractMethods(body);
            List<FieldDef> fields = extractFields(body);

            classes.add(ClassDef.builder()
                    .name(name)
                    .qualifiedName(name)
                    .type(ClassType.CLASS)
                    .visibility("public")
                    .superClass(superClass)
                    .interfaces(interfaces)
                    .methods(methods)
                    .fields(fields)
                    .dependencies(buildDeps(name, fields, methods))
                    .build());
        }

        if (supportsTypeScriptConstructs()) {
            Matcher im = INTERFACE_RE.matcher(source);
            while (im.find()) {
                String name = im.group(1);
                List<String> extended = parseList(im.group(2));
                String body = extractBody(source, im.end() - 1);

                classes.add(ClassDef.builder()
                        .name(name)
                        .qualifiedName(name)
                        .type(ClassType.INTERFACE)
                        .visibility("public")
                        .interfaces(extended)
                        .methods(extractMethods(body))
                        .build());
            }

            Matcher em = ENUM_RE.matcher(source);
            while (em.find()) {
                classes.add(ClassDef.builder()
                        .name(em.group(1))
                        .qualifiedName(em.group(1))
                        .type(ClassType.ENUM)
                        .visibility("public")
                        .build());
            }
        }

        return classes;
    }

    protected boolean supportsTypeScriptConstructs() {
        return false;
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

    private List<MethodDef> extractMethods(String body) {
        List<MethodDef> methods = new ArrayList<>();
        Matcher m = METHOD_RE.matcher(body);
        while (m.find()) {
            String name = m.group(1);
            if (KEYWORDS.contains(name) || name.equals("constructor")) continue;
            methods.add(MethodDef.builder()
                    .name(name)
                    .returnType("void")
                    .visibility("public")
                    .parameterTypes(parseParamTypes(m.group(2)))
                    .isStatic(false)
                    .isAbstract(false)
                    .build());
        }
        return methods;
    }

    private List<FieldDef> extractFields(String body) {
        List<FieldDef> fields = new ArrayList<>();
        Matcher m = FIELD_RE.matcher(body);
        while (m.find()) {
            String vis = m.group(1) != null ? m.group(1) : "public";
            boolean isStatic = m.group(2) != null;
            String name = m.group(3);
            String type = m.group(4) != null ? m.group(4).trim() : "any";

            if (KEYWORDS.contains(name) || name.equals("constructor")) continue;

            fields.add(FieldDef.builder()
                    .name(name)
                    .type(type)
                    .visibility(vis)
                    .isStatic(isStatic)
                    .isFinal(false)
                    .build());
        }
        return fields;
    }

    private List<String> buildDeps(String className, List<FieldDef> fields, List<MethodDef> methods) {
        Set<String> deps = new LinkedHashSet<>();
        fields.forEach(f -> deps.add(stripGenerics(f.getType())));
        methods.forEach(m -> {
            deps.add(stripGenerics(m.getReturnType()));
            m.getParameterTypes().forEach(p -> deps.add(stripGenerics(p)));
        });
        return deps.stream()
                .filter(d -> !d.isBlank() && !d.equals("void") && !d.equals("any"))
                .filter(d -> !isPrimitive(d))
                .filter(d -> !d.equals(className))
                .distinct()
                .toList();
    }

    private List<String> parseList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(s -> stripGenerics(s.trim()))
                .filter(s -> !s.isBlank())
                .toList();
    }

    private List<String> parseParamTypes(String paramsStr) {
        if (paramsStr == null || paramsStr.isBlank()) return List.of();
        List<String> types = new ArrayList<>();
        for (String param : paramsStr.split(",")) {
            String[] parts = param.trim().split(":");
            if (parts.length >= 2) {
                types.add(stripGenerics(parts[parts.length - 1].trim()));
            } else {
                types.add("any");
            }
        }
        return types;
    }

    private String stripGenerics(String type) {
        if (type == null) return "";
        int lt = type.indexOf('<');
        return lt >= 0 ? type.substring(0, lt).trim() : type.trim();
    }

    private boolean isPrimitive(String type) {
        return PRIMITIVES.contains(type.toLowerCase());
    }
}
