package com.example.analysisservice.parser.java;

import com.example.analysisservice.model.*;
import com.example.analysisservice.parser.LanguageParser;
import lombok.extern.slf4j.Slf4j;
import org.antlr.v4.runtime.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Stream;

@Slf4j
@Component
public class JavaLanguageParser implements LanguageParser {

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
            CharStream chars = CharStreams.fromString(source);

            JavaStructureLexer lexer = new JavaStructureLexer(chars);
            lexer.removeErrorListeners();
            lexer.addErrorListener(SilentErrorListener.INSTANCE);

            CommonTokenStream tokens = new CommonTokenStream(lexer);

            JavaStructureParser parser = new JavaStructureParser(tokens);
            parser.removeErrorListeners();
            parser.addErrorListener(SilentErrorListener.INSTANCE);

            JavaStructureParser.CompilationUnitContext tree = parser.compilationUnit();
            return Optional.of(new StructureVisitor(filename).visitCompilationUnit(tree));
        } catch (Exception e) {
            log.warn("Cannot parse {}: {}", filename, e.getMessage());
            return Optional.empty();
        }
    }

    // -----------------------------------------------------------------------
    // Visitor
    // -----------------------------------------------------------------------

    private static class StructureVisitor extends JavaStructureBaseVisitor<Object> {

        private static final Set<String> PRIMITIVES = Set.of(
                "int", "long", "double", "float", "boolean", "char", "byte", "short",
                "Integer", "Long", "Double", "Float", "Boolean", "Character", "Byte", "Short",
                "String", "Object", "void", "Void", "Number", "CharSequence"
        );

        private final String filename;

        StructureVisitor(String filename) {
            this.filename = filename;
        }

        // ---- Top level ----

        @Override
        public CodeUnit visitCompilationUnit(JavaStructureParser.CompilationUnitContext ctx) {
            String pkg = ctx.packageDeclaration() != null
                    ? ctx.packageDeclaration().qualifiedName().getText()
                    : "";

            List<String> imports = ctx.importDeclaration().stream()
                    .map(id -> id.qualifiedName().getText())
                    .toList();

            List<ClassDef> classes = ctx.typeDeclaration().stream()
                    .map(this::visitTypeDeclaration)
                    .filter(Objects::nonNull)
                    .toList();

            return CodeUnit.builder()
                    .fileName(filename)
                    .packageName(pkg)
                    .language(Language.JAVA)
                    .imports(imports)
                    .classes(classes)
                    .build();
        }

        @Override
        public ClassDef visitTypeDeclaration(JavaStructureParser.TypeDeclarationContext ctx) {
            if (ctx.classDeclaration() != null)      return visitClassDeclaration(ctx.classDeclaration());
            if (ctx.enumDeclaration() != null)        return visitEnumDeclaration(ctx.enumDeclaration());
            if (ctx.interfaceDeclaration() != null)   return visitInterfaceDeclaration(ctx.interfaceDeclaration());
            if (ctx.recordDeclaration() != null)      return visitRecordDeclaration(ctx.recordDeclaration());
            if (ctx.annotationTypeDeclaration() != null) return visitAnnotationTypeDeclaration(ctx.annotationTypeDeclaration());
            return null;
        }

        // ---- Class ----

        @Override
        public ClassDef visitClassDeclaration(JavaStructureParser.ClassDeclarationContext ctx) {
            List<JavaStructureParser.ModifierContext> mods = ctx.modifier();
            ClassType type = hasModifier(mods, "abstract") ? ClassType.ABSTRACT_CLASS : ClassType.CLASS;
            String superClass  = ctx.typeType() != null ? ctx.typeType().getText() : null;
            List<String> ifaces = ctx.typeList() != null ? extractTypeList(ctx.typeList()) : List.of();

            return buildFromClassBody(
                    ctx.IDENTIFIER().getText(), type, extractVisibility(mods),
                    superClass, ifaces, ctx.classBody().classBodyDeclaration());
        }

        // ---- Enum ----

        @Override
        public ClassDef visitEnumDeclaration(JavaStructureParser.EnumDeclarationContext ctx) {
            List<String> ifaces = ctx.typeList() != null ? extractTypeList(ctx.typeList()) : List.of();
            // body members after the optional ';' inside the enum
            return buildFromClassBody(
                    ctx.IDENTIFIER().getText(), ClassType.ENUM, extractVisibility(ctx.modifier()),
                    null, ifaces, ctx.classBodyDeclaration());
        }

        // ---- Interface ----

        @Override
        public ClassDef visitInterfaceDeclaration(JavaStructureParser.InterfaceDeclarationContext ctx) {
            List<String> extended = ctx.typeList() != null ? extractTypeList(ctx.typeList()) : List.of();

            List<MethodDef> methods = new ArrayList<>();
            List<FieldDef>  fields  = new ArrayList<>();

            for (var decl : ctx.interfaceBody().interfaceBodyDeclaration()) {
                var member = decl.interfaceMemberDeclaration();
                if (member == null) continue;
                var mods = decl.modifier();

                if (member.interfaceMethodDeclaration() != null) {
                    methods.add(buildInterfaceMethod(member.interfaceMethodDeclaration(), mods));
                } else if (member.constDeclaration() != null) {
                    fields.addAll(buildConstFields(member.constDeclaration()));
                }
            }

            return assembleClassDef(
                    ctx.IDENTIFIER().getText(), ClassType.INTERFACE, extractVisibility(ctx.modifier()),
                    null, extended, methods, fields);
        }

        // ---- Record ----

        @Override
        public ClassDef visitRecordDeclaration(JavaStructureParser.RecordDeclarationContext ctx) {
            List<String> ifaces = ctx.typeList() != null ? extractTypeList(ctx.typeList()) : List.of();
            return buildFromClassBody(
                    ctx.IDENTIFIER().getText(), ClassType.RECORD, extractVisibility(ctx.modifier()),
                    null, ifaces, ctx.classBodyDeclaration());
        }

        // ---- Annotation type ----

        @Override
        public ClassDef visitAnnotationTypeDeclaration(JavaStructureParser.AnnotationTypeDeclarationContext ctx) {
            return assembleClassDef(
                    ctx.IDENTIFIER().getText(), ClassType.ANNOTATION, extractVisibility(ctx.modifier()),
                    null, List.of(), List.of(), List.of());
        }

        // ---- Builders ----

        /** Extracts methods + fields from a list of class body declarations then assembles ClassDef. */
        private ClassDef buildFromClassBody(
                String name, ClassType type, String visibility,
                String superClass, List<String> ifaces,
                List<JavaStructureParser.ClassBodyDeclarationContext> bodyDecls) {

            List<MethodDef> methods = new ArrayList<>();
            List<FieldDef>  fields  = new ArrayList<>();

            for (var decl : bodyDecls) {
                if (decl.memberDeclaration() == null) continue;
                var member    = decl.memberDeclaration();
                var memberMods = decl.modifier();

                if (member.methodDeclaration() != null) {
                    methods.add(buildMethod(member.methodDeclaration(), memberMods));
                } else if (member.fieldDeclaration() != null) {
                    fields.addAll(buildFields(member.fieldDeclaration(), memberMods));
                }
            }

            return assembleClassDef(name, type, visibility, superClass, ifaces, methods, fields);
        }

        private ClassDef assembleClassDef(
                String name, ClassType type, String visibility,
                String superClass, List<String> ifaces,
                List<MethodDef> methods, List<FieldDef> fields) {

            return ClassDef.builder()
                    .name(name)
                    .type(type)
                    .visibility(visibility)
                    .superClass(superClass)
                    .interfaces(ifaces)
                    .methods(methods)
                    .fields(fields)
                    .dependencies(extractDependencies(name, fields, methods))
                    .build();
        }

        // ---- Method builders ----

        private MethodDef buildMethod(
                JavaStructureParser.MethodDeclarationContext ctx,
                List<JavaStructureParser.ModifierContext> mods) {
            return MethodDef.builder()
                    .name(ctx.IDENTIFIER().getText())
                    .returnType(ctx.typeTypeOrVoid().getText())
                    .visibility(extractVisibility(mods))
                    .parameterTypes(extractParamTypes(ctx.formalParameters()))
                    .isStatic(hasModifier(mods, "static"))
                    .isAbstract(hasModifier(mods, "abstract"))
                    .build();
        }

        private MethodDef buildInterfaceMethod(
                JavaStructureParser.InterfaceMethodDeclarationContext ctx,
                List<JavaStructureParser.ModifierContext> mods) {
            boolean isDefault = hasModifier(mods, "default");
            boolean isStatic  = hasModifier(mods, "static");
            return MethodDef.builder()
                    .name(ctx.IDENTIFIER().getText())
                    .returnType(ctx.typeTypeOrVoid().getText())
                    .visibility(hasModifier(mods, "private") ? "private" : "public")
                    .parameterTypes(extractParamTypes(ctx.formalParameters()))
                    .isStatic(isStatic)
                    .isAbstract(!isDefault && !isStatic)
                    .build();
        }

        // ---- Field builders ----

        private List<FieldDef> buildFields(
                JavaStructureParser.FieldDeclarationContext ctx,
                List<JavaStructureParser.ModifierContext> mods) {
            String type = ctx.typeType().getText();
            return ctx.variableDeclarators().variableDeclarator().stream()
                    .map(v -> FieldDef.builder()
                            .name(v.IDENTIFIER().getText())
                            .type(type)
                            .visibility(extractVisibility(mods))
                            .isStatic(hasModifier(mods, "static"))
                            .isFinal(hasModifier(mods, "final"))
                            .build())
                    .toList();
        }

        private List<FieldDef> buildConstFields(JavaStructureParser.ConstDeclarationContext ctx) {
            String type = ctx.typeType().getText();
            return ctx.constantDeclarator().stream()
                    .map(cd -> FieldDef.builder()
                            .name(cd.IDENTIFIER().getText())
                            .type(type)
                            .visibility("public")
                            .isStatic(true)
                            .isFinal(true)
                            .build())
                    .toList();
        }

        // ---- Helpers ----

        private List<String> extractParamTypes(JavaStructureParser.FormalParametersContext ctx) {
            if (ctx.formalParameterList() == null) return List.of();
            var pl = ctx.formalParameterList();
            return Stream.concat(
                    pl.formalParameter().stream().map(p -> p.typeType().getText()),
                    pl.lastFormalParameter() != null
                            ? Stream.of(pl.lastFormalParameter().typeType().getText() + "...")
                            : Stream.empty()
            ).toList();
        }

        private List<String> extractTypeList(JavaStructureParser.TypeListContext ctx) {
            return ctx.typeType().stream()
                    .map(RuleContext::getText)
                    .toList();
        }

        private List<String> extractDependencies(
                String className, List<FieldDef> fields, List<MethodDef> methods) {
            Set<String> deps = new LinkedHashSet<>();
            fields.forEach(f -> deps.add(stripGenerics(f.getType())));
            methods.forEach(m -> {
                deps.add(stripGenerics(m.getReturnType()));
                m.getParameterTypes().forEach(p -> deps.add(stripGenerics(p.replace("...", ""))));
            });
            return deps.stream()
                    .filter(d -> !d.isBlank() && !d.equals("void"))
                    .filter(d -> !isPrimitive(d))
                    .filter(d -> !d.equals(className))
                    .distinct()
                    .toList();
        }

        private String extractVisibility(List<JavaStructureParser.ModifierContext> mods) {
            for (var m : mods) {
                String t = m.getText();
                if (t.equals("public"))    return "public";
                if (t.equals("protected")) return "protected";
                if (t.equals("private"))   return "private";
            }
            return "package-private";
        }

        private boolean hasModifier(List<JavaStructureParser.ModifierContext> mods, String kw) {
            return mods.stream().anyMatch(m -> m.getText().equals(kw));
        }

        private String stripGenerics(String type) {
            int lt = type.indexOf('<');
            return lt >= 0 ? type.substring(0, lt) : type;
        }

        private boolean isPrimitive(String type) {
            return PRIMITIVES.contains(type) || (!type.isEmpty() && type.equals(type.toLowerCase()));
        }
    }

    // -----------------------------------------------------------------------
    // Silent error listener
    // -----------------------------------------------------------------------

    private static final class SilentErrorListener extends BaseErrorListener {
        static final SilentErrorListener INSTANCE = new SilentErrorListener();

        @Override
        public void syntaxError(Recognizer<?, ?> recognizer, Object offendingSymbol,
                                int line, int charPositionInLine,
                                String msg, RecognitionException e) {
            // swallowed — parse failures are handled at the file level
        }
    }
}
