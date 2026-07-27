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
    private static final Pattern PROPERTY_RE = Pattern.compile(
            "(?m)^[ \\t]*(?:(public|private|protected)\\s+)?(?:(static)\\s+)?(?:\\??[\\w\\\\]+\\s+)?(\\$\\w+)\\s*(?:=|;)"
    );

    // PHP 8 / PHPDoc: marks the class as a Doctrine entity
    //   #[ORM\Entity] or #[ORM\Entity(repositoryClass: ...)] or @ORM\Entity
    private static final Pattern ORM_ENTITY_RE = Pattern.compile(
            "#\\[ORM\\\\Entity(?:\\([^)]*\\))?\\]|@ORM\\\\Entity(?:\\([^)]*\\))?",
            Pattern.CASE_INSENSITIVE
    );

    // PHP 8 attribute with explicit targetEntity:
    //   #[ORM\ManyToOne(targetEntity: Category::class, ...)]
    private static final Pattern ORM_ATTR_TARGET_RE = Pattern.compile(
            "#\\[ORM\\\\(ManyToOne|OneToMany|ManyToMany|OneToOne)\\s*\\([^)]*?targetEntity\\s*:\\s*(\\w+)::class",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // PHP 8 attribute without targetEntity — infer from the typed property that follows:
    //   #[ORM\ManyToOne(inversedBy: 'products')]
    //   #[ORM\JoinColumn(nullable: false)]       ← optional extra attributes
    //   private ?Category $category;
    private static final Pattern ORM_ATTR_INFER_RE = Pattern.compile(
            "#\\[ORM\\\\(ManyToOne|OneToMany|ManyToMany|OneToOne)(?:\\([^)]*\\))?\\]" +
            "(?:\\s*#\\[[^\\]]*\\])*" +
            "\\s*(?:public|private|protected)\\s+(?:readonly\\s+)?\\??(\\w+)\\s+\\$",
            Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );

    // PHPDoc annotation:
    //   @ORM\ManyToOne(targetEntity="Category") or targetEntity=Category::class
    private static final Pattern ORM_DOC_RE = Pattern.compile(
            "@ORM\\\\(ManyToOne|OneToMany|ManyToMany|OneToOne)\\s*\\([^)]*?targetEntity\\s*=\\s*[\"']?(\\w+)",
            Pattern.CASE_INSENSITIVE
    );

    private static final Set<String> PHP_PRIMITIVES = Set.of(
            "string", "int", "float", "bool", "array", "null", "void",
            "mixed", "iterable", "callable", "object", "resource", "never",
            "self", "static", "parent"
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
            List<OrmRelation> ormRelations = extractOrmRelations(body);

            // Look at text between the previous class closing brace and this class declaration
            // to detect #[ORM\Entity] / @ORM\Entity annotations.
            int lastBrace = source.lastIndexOf('}', m.start() - 1);
            String preClass = lastBrace >= 0
                    ? source.substring(lastBrace + 1, m.start())
                    : source.substring(0, m.start());
            boolean isDoctrineEntity = ORM_ENTITY_RE.matcher(preClass).find();

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
                    .ormRelations(ormRelations)
                    .doctrineEntity(isDoctrineEntity)
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

    private List<OrmRelation> extractOrmRelations(String body) {
        List<OrmRelation> relations = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // PHP 8 attribute with explicit targetEntity
        Matcher m1 = ORM_ATTR_TARGET_RE.matcher(body);
        while (m1.find()) {
            addRelation(relations, seen, m1.group(1), m1.group(2));
        }

        // PHP 8 attribute — infer target from the property type that follows
        Matcher m2 = ORM_ATTR_INFER_RE.matcher(body);
        while (m2.find()) {
            String target = m2.group(2);
            if (!PHP_PRIMITIVES.contains(target.toLowerCase())) {
                addRelation(relations, seen, m2.group(1), target);
            }
        }

        // PHPDoc annotations
        Matcher m3 = ORM_DOC_RE.matcher(body);
        while (m3.find()) {
            addRelation(relations, seen, m3.group(1), m3.group(2));
        }

        return relations;
    }

    private void addRelation(List<OrmRelation> relations, Set<String> seen,
                             String rawType, String targetEntity) {
        String type = normalizeRelationType(rawType);
        String key = type + ":" + targetEntity;
        if (seen.add(key)) {
            relations.add(OrmRelation.builder()
                    .relationType(type)
                    .targetEntity(targetEntity)
                    .build());
        }
    }

    private String normalizeRelationType(String raw) {
        return switch (raw.toLowerCase()) {
            case "manytoone"  -> "MANY_TO_ONE";
            case "onetomany"  -> "ONE_TO_MANY";
            case "manytomany" -> "MANY_TO_MANY";
            case "onetoone"   -> "ONE_TO_ONE";
            default           -> raw.toUpperCase();
        };
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
