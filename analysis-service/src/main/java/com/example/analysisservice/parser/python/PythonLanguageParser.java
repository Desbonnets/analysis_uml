package com.example.analysisservice.parser.python;

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
public class PythonLanguageParser implements LanguageParser {

    // from x.y import z  or  import x, y
    private static final Pattern IMPORT_RE = Pattern.compile(
            "^(?:from\\s+([\\w.]+)\\s+import|import\\s+([\\w., ]+))"
    );
    // class Name[(Base1, Base2)]:
    private static final Pattern CLASS_RE = Pattern.compile(
            "^([ \\t]*)class\\s+(\\w+)\\s*(?:\\(([^)]*)\\))?\\s*:"
    );
    // def name(params) [-> ReturnType]:
    private static final Pattern METHOD_RE = Pattern.compile(
            "^def\\s+(\\w+)\\s*\\(([^)]*)\\)(?:\\s*->\\s*([\\w\\[\\]|,. ?]+))?\\s*:"
    );
    // self.name[: Type] =
    private static final Pattern SELF_FIELD_RE = Pattern.compile(
            "^self\\.(\\w+)(?:\\s*:\\s*([\\w\\[\\]|,. ?]+))?\\s*="
    );
    // name: Type  (class-level annotation, not assignment)
    private static final Pattern CLASS_VAR_RE = Pattern.compile(
            "^(\\w+)\\s*:\\s*([\\w\\[\\]|,. ?]+)\\s*$"
    );

    @Override
    public Language getLanguage() {
        return Language.PYTHON;
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
        String[] lines = source.split("\\r?\\n");
        List<String> imports = new ArrayList<>();
        List<ClassDef> classes = new ArrayList<>();

        int i = 0;
        while (i < lines.length) {
            String line = lines[i];
            String trimmed = line.trim();

            if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                i++;
                continue;
            }

            Matcher importMatcher = IMPORT_RE.matcher(trimmed);
            if (importMatcher.find()) {
                String mod = importMatcher.group(1) != null
                        ? importMatcher.group(1)
                        : importMatcher.group(2).split(",")[0].trim();
                imports.add(mod);
                i++;
                continue;
            }

            Matcher classMatcher = CLASS_RE.matcher(line);
            if (classMatcher.find()) {
                int classIndent = indentOf(classMatcher.group(1));
                String className = classMatcher.group(2);
                List<String> bases = parseList(classMatcher.group(3));

                // Collect body: lines strictly more indented than the class declaration
                i++;
                List<String> bodyLines = new ArrayList<>();
                while (i < lines.length) {
                    String bodyLine = lines[i];
                    if (!bodyLine.trim().isEmpty() && indentOf(bodyLine) <= classIndent) break;
                    bodyLines.add(bodyLine);
                    i++;
                }

                int memberIndent = firstNonBlankIndent(bodyLines, classIndent);
                List<MethodDef> methods = extractMethods(bodyLines, memberIndent);
                List<FieldDef> fields = extractFields(bodyLines, memberIndent);

                String superClass = bases.isEmpty() ? null
                        : "object".equalsIgnoreCase(bases.get(0)) ? null : bases.get(0);
                List<String> ifaces = bases.size() > 1 ? bases.subList(1, bases.size()) : List.of();

                classes.add(ClassDef.builder()
                        .name(className)
                        .qualifiedName(className)
                        .type(isEnumClass(bases) ? ClassType.ENUM : ClassType.CLASS)
                        .visibility("public")
                        .superClass(superClass)
                        .interfaces(ifaces)
                        .methods(methods)
                        .fields(fields)
                        .dependencies(buildDeps(className, fields, methods))
                        .entity(isOrmEntity(bases))
                        .build());
                continue;
            }

            i++;
        }

        return CodeUnit.builder()
                .fileName(filename)
                .language(Language.PYTHON)
                .imports(imports)
                .classes(classes)
                .build();
    }

    private List<MethodDef> extractMethods(List<String> bodyLines, int memberIndent) {
        List<MethodDef> methods = new ArrayList<>();
        for (String line : bodyLines) {
            if (line.trim().isEmpty() || line.trim().startsWith("#")) continue;
            if (indentOf(line) != memberIndent) continue;
            Matcher m = METHOD_RE.matcher(line.trim());
            if (!m.find()) continue;

            String name = m.group(1);
            String returnType = m.group(3) != null ? m.group(3).trim() : "None";
            List<String> params = parsePyParams(m.group(2));
            String vis = name.startsWith("__") && !name.equals("__init__") ? "private"
                    : name.startsWith("_") ? "protected" : "public";

            methods.add(MethodDef.builder()
                    .name(name)
                    .returnType(returnType)
                    .visibility(vis)
                    .parameterTypes(params)
                    .isStatic(false)
                    .isAbstract(false)
                    .build());
        }
        return methods;
    }

    private List<FieldDef> extractFields(List<String> bodyLines, int memberIndent) {
        Set<String> seen = new LinkedHashSet<>();
        List<FieldDef> fields = new ArrayList<>();
        boolean inInit = false;

        for (String line : bodyLines) {
            if (line.trim().isEmpty() || line.trim().startsWith("#")) continue;
            int indent = indentOf(line);
            String trimmed = line.trim();

            // Track when we enter/exit __init__
            if (indent == memberIndent) {
                Matcher m = METHOD_RE.matcher(trimmed);
                inInit = m.find() && "__init__".equals(m.group(1));
            }

            // Class-level type annotations (name: Type) at member indent
            if (indent == memberIndent) {
                Matcher m = CLASS_VAR_RE.matcher(trimmed);
                if (m.find() && !trimmed.startsWith("def ") && !trimmed.startsWith("class ")) {
                    String name = m.group(1);
                    if (seen.add(name)) {
                        fields.add(FieldDef.builder()
                                .name(name).type(m.group(2).trim())
                                .visibility("public").isStatic(true).isFinal(false)
                                .build());
                    }
                }
            }

            // self.x = ... inside __init__
            if (inInit && indent > memberIndent) {
                Matcher m = SELF_FIELD_RE.matcher(trimmed);
                if (m.find()) {
                    String name = m.group(1);
                    String type = m.group(2) != null ? m.group(2).trim() : "Any";
                    if (seen.add(name)) {
                        String vis = name.startsWith("__") ? "private"
                                : name.startsWith("_") ? "protected" : "public";
                        fields.add(FieldDef.builder()
                                .name(name).type(type)
                                .visibility(vis).isStatic(false).isFinal(false)
                                .build());
                    }
                }
            }
        }
        return fields;
    }

    private List<String> buildDeps(String className, List<FieldDef> fields, List<MethodDef> methods) {
        Set<String> deps = new LinkedHashSet<>();
        fields.forEach(f -> deps.add(f.getType()));
        methods.forEach(m -> {
            deps.add(m.getReturnType());
            m.getParameterTypes().forEach(deps::add);
        });
        return deps.stream()
                .filter(d -> !d.isBlank() && !d.equals("None") && !d.equals("Any"))
                .filter(d -> !d.equals(className))
                .distinct()
                .toList();
    }

    private List<String> parsePyParams(String paramsStr) {
        if (paramsStr == null || paramsStr.isBlank()) return List.of();
        List<String> types = new ArrayList<>();
        for (String param : paramsStr.split(",")) {
            String p = param.trim().split("=")[0].trim(); // drop default value
            if (p.equals("self") || p.equals("cls") || p.isEmpty()) continue;
            String[] parts = p.split(":");
            types.add(parts.length >= 2 ? parts[1].trim() : "Any");
        }
        return types;
    }

    // Django (models.Model / db.Model) and SQLAlchemy (Base / DeclarativeBase) conventions
    private static final Set<String> ORM_BASE_NAMES = Set.of("Model", "Base", "DeclarativeBase");

    private boolean isOrmEntity(List<String> bases) {
        for (String base : bases) {
            String simple = base.contains(".") ? base.substring(base.lastIndexOf('.') + 1) : base;
            if (ORM_BASE_NAMES.contains(simple)) return true;
        }
        return false;
    }

    // stdlib enum module: Enum, IntEnum, StrEnum (3.11+), Flag, IntFlag
    private static final Set<String> ENUM_BASE_NAMES = Set.of("Enum", "IntEnum", "StrEnum", "Flag", "IntFlag");

    private boolean isEnumClass(List<String> bases) {
        for (String base : bases) {
            String simple = base.contains(".") ? base.substring(base.lastIndexOf('.') + 1) : base;
            if (ENUM_BASE_NAMES.contains(simple)) return true;
        }
        return false;
    }

    private List<String> parseList(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim).filter(s -> !s.isBlank()).toList();
    }

    private int indentOf(String line) {
        int count = 0;
        for (char c : line.toCharArray()) {
            if (c == ' ') count++;
            else if (c == '\t') count += 4;
            else break;
        }
        return count;
    }

    private int firstNonBlankIndent(List<String> lines, int classIndent) {
        for (String line : lines) {
            if (!line.trim().isEmpty() && !line.trim().startsWith("#")) {
                return indentOf(line);
            }
        }
        return classIndent + 4;
    }
}
