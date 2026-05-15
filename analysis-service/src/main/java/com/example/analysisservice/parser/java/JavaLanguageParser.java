package com.example.analysisservice.parser.java;

import com.example.analysisservice.model.*;
import com.example.analysisservice.parser.LanguageParser;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Modifier;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.type.ClassOrInterfaceType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Stream;

@Slf4j
@Component
public class JavaLanguageParser implements LanguageParser {

    private static final Set<String> PRIMITIVES = Set.of(
            "int", "long", "double", "float", "boolean", "char", "byte", "short",
            "Integer", "Long", "Double", "Float", "Boolean", "Character", "Byte", "Short",
            "String", "Object", "void", "Void", "Number", "CharSequence"
    );

    @Override
    public Language getLanguage() {
        return Language.JAVA;
    }

    @Override
    public List<CodeUnit> parse(Map<String, byte[]> files) throws IOException {
        return files.entrySet().stream()
                .map(e -> parseFile(e.getKey(), e.getValue()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    private Optional<CodeUnit> parseFile(String filename, byte[] content) {
        try {
            String source = new String(content, StandardCharsets.UTF_8);
            CompilationUnit cu = StaticJavaParser.parse(source);
            return Optional.of(buildCodeUnit(filename, cu));
        } catch (Exception e) {
            log.warn("Cannot parse {}: {}", filename, e.getMessage());
            return Optional.empty();
        }
    }

    private CodeUnit buildCodeUnit(String filename, CompilationUnit cu) {
        String packageName = cu.getPackageDeclaration()
                .map(pd -> pd.getName().asString())
                .orElse("");

        List<String> imports = cu.getImports().stream()
                .map(id -> id.getNameAsString())
                .toList();

        List<ClassDef> classes = cu.getTypes().stream()
                .map(t -> buildClassDef(t, packageName))
                .toList();

        return CodeUnit.builder()
                .fileName(filename)
                .packageName(packageName)
                .language(Language.JAVA)
                .imports(imports)
                .classes(classes)
                .build();
    }

    private ClassDef buildClassDef(TypeDeclaration<?> type, String packageName) {
        ClassType classType;
        String superClass = null;
        List<String> implementedInterfaces = new ArrayList<>();

        if (type instanceof ClassOrInterfaceDeclaration coid) {
            if (coid.isInterface()) {
                classType = ClassType.INTERFACE;
            } else if (coid.hasModifier(Modifier.Keyword.ABSTRACT)) {
                classType = ClassType.ABSTRACT_CLASS;
            } else {
                classType = ClassType.CLASS;
            }
            if (!coid.getExtendedTypes().isEmpty()) {
                superClass = coid.getExtendedTypes().get(0).getNameAsString();
            }
            implementedInterfaces = coid.getImplementedTypes().stream()
                    .map(ClassOrInterfaceType::getNameAsString)
                    .toList();
        } else if (type instanceof EnumDeclaration ed) {
            classType = ClassType.ENUM;
            implementedInterfaces = ed.getImplementedTypes().stream()
                    .map(ClassOrInterfaceType::getNameAsString)
                    .toList();
        } else if (type instanceof RecordDeclaration) {
            classType = ClassType.RECORD;
        } else if (type instanceof AnnotationDeclaration) {
            classType = ClassType.ANNOTATION;
        } else {
            classType = ClassType.CLASS;
        }

        List<MethodDef> methods = type.getMethods().stream()
                .map(this::buildMethodDef)
                .toList();

        List<FieldDef> fields = type.getFields().stream()
                .flatMap(fd -> buildFieldDefs(fd).stream())
                .toList();

        List<String> dependencies = extractDependencies(type);

        return ClassDef.builder()
                .name(type.getNameAsString())
                .qualifiedName(packageName.isEmpty()
                        ? type.getNameAsString()
                        : packageName + "." + type.getNameAsString())
                .type(classType)
                .visibility(extractVisibility(type.getModifiers()))
                .superClass(superClass)
                .interfaces(implementedInterfaces)
                .methods(methods)
                .fields(fields)
                .dependencies(dependencies)
                .build();
    }

    private MethodDef buildMethodDef(MethodDeclaration method) {
        NodeList<Modifier> mods = method.getModifiers();
        List<String> paramTypes = method.getParameters().stream()
                .map(p -> p.getType().asString())
                .toList();

        return MethodDef.builder()
                .name(method.getNameAsString())
                .returnType(method.getType().asString())
                .visibility(extractVisibility(mods))
                .parameterTypes(paramTypes)
                .isStatic(method.hasModifier(Modifier.Keyword.STATIC))
                .isAbstract(method.hasModifier(Modifier.Keyword.ABSTRACT))
                .build();
    }

    private List<FieldDef> buildFieldDefs(FieldDeclaration field) {
        NodeList<Modifier> mods = field.getModifiers();
        String type = field.getElementType().asString();
        String visibility = extractVisibility(mods);
        boolean isStatic = field.hasModifier(Modifier.Keyword.STATIC);
        boolean isFinal = field.hasModifier(Modifier.Keyword.FINAL);

        return field.getVariables().stream()
                .map(v -> FieldDef.builder()
                        .name(v.getNameAsString())
                        .type(type)
                        .visibility(visibility)
                        .isStatic(isStatic)
                        .isFinal(isFinal)
                        .build())
                .toList();
    }

    private String extractVisibility(NodeList<Modifier> mods) {
        for (Modifier mod : mods) {
            switch (mod.getKeyword()) {
                case PUBLIC    -> { return "public"; }
                case PROTECTED -> { return "protected"; }
                case PRIVATE   -> { return "private"; }
                default        -> {}
            }
        }
        return "package-private";
    }

    private List<String> extractDependencies(TypeDeclaration<?> type) {
        String className = type.getNameAsString();
        Set<String> deps = new LinkedHashSet<>();

        // field types
        type.getFields().forEach(fd -> deps.add(stripGenerics(fd.getElementType().asString())));

        // method return types + parameter types
        type.getMethods().forEach(md -> {
            deps.add(stripGenerics(md.getType().asString()));
            md.getParameters().forEach(p -> deps.add(stripGenerics(p.getType().asString())));
        });

        return deps.stream()
                .filter(d -> !d.isBlank())
                .filter(d -> !d.equals("void"))
                .filter(d -> !isPrimitive(d))
                .filter(d -> !d.equals(className))
                .distinct()
                .toList();
    }

    private String stripGenerics(String type) {
        int lt = type.indexOf('<');
        return lt >= 0 ? type.substring(0, lt).trim() : type.trim();
    }

    private boolean isPrimitive(String type) {
        return PRIMITIVES.contains(type)
                || type.equals(type.toLowerCase()); // lowercase = Java primitive (int, boolean…)
    }
}
