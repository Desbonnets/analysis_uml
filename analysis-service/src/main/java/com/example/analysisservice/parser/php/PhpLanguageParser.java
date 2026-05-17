package com.example.analysisservice.parser.php;

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
public class PhpLanguageParser implements LanguageParser {

    private static final Pattern NAMESPACE_RE = Pattern.compile(
            "(?m)^\\s*namespace\\s+([\\w\\\\]+)\\s*;"
    );
    private static final Pattern USE_RE = Pattern.compile(
            "(?m)^\\s*use\\s+([\\w\\\\]+(?:\\s*,\\s*[\\w\\\\]+)*)\\s*;"
    );
    private static final Pattern CLASS_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:abstract\\s+|final\\s+)?class\\s+(\\w+)" +
            "(?:\\s+extends\\s+(\\w+))?" +
            "(?:\\s+implements\\s+([\\w\\s,\\\\]+?))?" +
            "\\s*\\{"
    );
    private static final Pattern INTERFACE_RE = Pattern.compile(
            "(?m)^[ \\t]*interface\\s+(\\w+)(?:\\s+extends\\s+([\\w\\s,\\\\]+?))?\\s*\\{"
    );
    private static final Pattern TRAIT_RE = Pattern.compile(
            "(?m)^[ \\t]*trait\\s+(\\w+)\\s*\\{"
    );
    private static final Pattern METHOD_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(public|private|protected)\\s+)?(?:(static)\\s+)?(?:(abstract)\\s+)?function\\s+(\\w+)\\s*\\(([^)]*)\\)" +
            "(?:\\s*:\\s*\\??[\\w\\\\]+)?\\s*(?:\\{|;)"
    );
    // Matches: [visibility] [static] [?type] $varName [= ...];
    private static final Pattern PROPERTY_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(public|private|protected)\\s+)?(?:(static)\\s+)?(?:\\??[\\w\\\\]+\\s+)?(\\$\\w+)\\s*(?:=|;)"
    );

    @Override
    public Language getLanguage() {
        return Language.PHP;
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
        Matcher nsMatcher = NAMESPACE_RE.matcher(source);
        String namespace = nsMatcher.find() ? nsMatcher.group(1) : "";

        List<String> imports = new ArrayList<>();
        Matcher useMatcher = USE_RE.matcher(source);
        while (useMatcher.find()) {
            Arrays.stream(useMatcher.group(1).split(","))
                    .map(String::trim)
                    .forEach(imports::add);
        }

        List<ClassDef> classes = new ArrayList<>();
        extractClasses(source, namespace, classes);
        extractInterfaces(source, namespace, classes);
        extractTraits(source, namespace, classes);

        return CodeUnit.builder()
                .fileName(filename)
                .packageName(namespace.replace("\\", "."))
                .language(Language.PHP)
                .imports(imports)
                .classes(classes)
                .build();
    }

    private void extractClasses(String source, String namespace, List<ClassDef> out) {
        Matcher m = CLASS_RE.matcher(source);
        while (m.find()) {
            String name = m.group(1);
            String superClass = m.group(2);
            List<String> ifaces = parseList(m.group(3));
            String body = extractBody(source, m.end() - 1);
            List<MethodDef> methods = extractMethods(body);
            List<FieldDef> fields = extractProperties(body);

            out.add(ClassDef.builder()
                    .name(name)
                    .qualifiedName(qualify(namespace, name))
                    .type(ClassType.CLASS)
                    .visibility("public")
                    .superClass(superClass)
                    .interfaces(ifaces)
                    .methods(methods)
                    .fields(fields)
                    .dependencies(buildDeps(name, fields, methods))
                    .build());
        }
    }

    private void extractInterfaces(String source, String namespace, List<ClassDef> out) {
        Matcher m = INTERFACE_RE.matcher(source);
        while (m.find()) {
            String name = m.group(1);
            List<String> extended = parseList(m.group(2));
            String body = extractBody(source, m.end() - 1);

            out.add(ClassDef.builder()
                    .name(name)
                    .qualifiedName(qualify(namespace, name))
                    .type(ClassType.INTERFACE)
                    .visibility("public")
                    .interfaces(extended)
                    .methods(extractMethods(body))
                    .build());
        }
    }

    private void extractTraits(String source, String namespace, List<ClassDef> out) {
        Matcher m = TRAIT_RE.matcher(source);
        while (m.find()) {
            String name = m.group(1);
            String body = extractBody(source, m.end() - 1);
            List<MethodDef> methods = extractMethods(body);
            List<FieldDef> fields = extractProperties(body);

            out.add(ClassDef.builder()
                    .name(name)
                    .qualifiedName(qualify(namespace, name))
                    .type(ClassType.CLASS)
                    .visibility("public")
                    .methods(methods)
                    .fields(fields)
                    .build());
        }
    }

    private List<MethodDef> extractMethods(String body) {
        List<MethodDef> methods = new ArrayList<>();
        Matcher m = METHOD_RE.matcher(body);
        while (m.find()) {
            String vis = m.group(1) != null ? m.group(1) : "public";
            boolean isStatic = m.group(2) != null;
            boolean isAbstract = m.group(3) != null;
            String name = m.group(4);
            List<String> params = parsePhpParamTypes(m.group(5));

            methods.add(MethodDef.builder()
                    .name(name)
                    .returnType("void")
                    .visibility(vis)
                    .parameterTypes(params)
                    .isStatic(isStatic)
                    .isAbstract(isAbstract)
                    .build());
        }
        return methods;
    }

    private List<FieldDef> extractProperties(String body) {
        List<FieldDef> fields = new ArrayList<>();
        Matcher m = PROPERTY_RE.matcher(body);
        while (m.find()) {
            String vis = m.group(1) != null ? m.group(1) : "public";
            boolean isStatic = m.group(2) != null;
            String rawName = m.group(3);
            String name = rawName.startsWith("$") ? rawName.substring(1) : rawName;

            fields.add(FieldDef.builder()
                    .name(name)
                    .type("mixed")
                    .visibility(vis)
                    .isStatic(isStatic)
                    .isFinal(false)
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

    private List<String> parseList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
    }

    private List<String> parsePhpParamTypes(String paramsStr) {
        if (paramsStr == null || paramsStr.isBlank()) return List.of();
        List<String> types = new ArrayList<>();
        for (String param : paramsStr.split(",")) {
            String trimmed = param.trim();
            // Pattern: [?]TypeHint $varName
            String[] parts = trimmed.split("\\$");
            if (parts.length >= 2 && !parts[0].isBlank()) {
                types.add(parts[0].trim().replace("?", "").replace("\\", "."));
            }
        }
        return types;
    }

    private List<String> buildDeps(String className, List<FieldDef> fields, List<MethodDef> methods) {
        Set<String> deps = new LinkedHashSet<>();
        methods.forEach(m -> m.getParameterTypes().forEach(deps::add));
        return deps.stream()
                .filter(d -> !d.isBlank() && !d.equals("void") && !d.equals("mixed"))
                .filter(d -> !d.equals(className))
                .distinct()
                .toList();
    }

    private String qualify(String namespace, String name) {
        return namespace.isBlank() ? name : namespace.replace("\\", ".") + "." + name;
    }
}
