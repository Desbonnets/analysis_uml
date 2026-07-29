package com.example.diagramservice.plantuml;

import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
import com.example.diagramservice.dto.PackageNode;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Converts diagram DTOs (class/dependency/package — code-derived, see ClassDiagramService,
 * DependencyGraphService, PackageDiagramService) into PlantUML class-diagram source text,
 * the reverse direction of PlantUmlParser. Output is re-importable as a conformance
 * reference diagram (see ConformanceService) since it only uses syntax PlantUmlParser
 * understands, plus cardinality labels on association arrows that PlantUmlParser ignores.
 */
@Component
public class PlantUmlExporter {

    public String exportClassDiagram(List<DiagramNode> nodes, List<DiagramEdge> edges) {
        StringBuilder sb = new StringBuilder("@startuml\n\n");

        for (DiagramNode n : nodes) {
            String alias = alias(n.getQualifiedName() != null ? n.getQualifiedName() : n.getName());
            if (n.getPackageName() != null && !n.getPackageName().isBlank()) {
                sb.append("' ").append(n.getPackageName()).append('\n');
            }
            sb.append(keyword(n.getType())).append(" \"").append(n.getName()).append("\" as ").append(alias);

            List<String> fields = n.getFields();
            List<String> methods = n.getMethods();
            boolean hasBody = (fields != null && !fields.isEmpty()) || (methods != null && !methods.isEmpty());
            if (!hasBody) {
                sb.append('\n');
                continue;
            }

            sb.append(" {\n");
            if (fields != null) {
                for (String f : fields) sb.append("  ").append(f).append('\n');
            }
            if (fields != null && !fields.isEmpty() && methods != null && !methods.isEmpty()) {
                sb.append("  --\n");
            }
            if (methods != null) {
                for (String m : methods) sb.append("  ").append(m).append('\n');
            }
            sb.append("}\n");
        }

        sb.append('\n');
        for (DiagramEdge e : edges) {
            sb.append(relationLine(alias(e.getFrom()), alias(e.getTo()), e.getType())).append('\n');
        }

        sb.append("\n@enduml\n");
        return sb.toString();
    }

    public String exportPackageDiagram(List<PackageNode> packages, List<DiagramEdge> edges) {
        StringBuilder sb = new StringBuilder("@startuml\n\n");

        for (PackageNode pkg : packages) {
            sb.append("package \"").append(pkg.getName()).append("\" {\n");
            if (pkg.getClasses() != null) {
                for (String cls : pkg.getClasses()) {
                    sb.append("  class \"").append(cls).append("\"\n");
                }
            }
            sb.append("}\n");
        }

        sb.append('\n');
        for (DiagramEdge e : edges) {
            sb.append('"').append(e.getFrom()).append("\" ..> \"").append(e.getTo()).append("\" : dépend de\n");
        }

        sb.append("\n@enduml\n");
        return sb.toString();
    }

    private String keyword(String type) {
        if (type == null) return "class";
        return switch (type.toUpperCase()) {
            case "ABSTRACT_CLASS" -> "abstract class";
            case "INTERFACE" -> "interface";
            case "ENUM" -> "enum";
            case "ANNOTATION" -> "annotation";
            default -> "class";
        };
    }

    private String relationLine(String fromAlias, String toAlias, String type) {
        if (type == null) return fromAlias + " --> " + toAlias;
        return switch (type) {
            case "EXTENDS" -> fromAlias + " --|> " + toAlias;
            case "IMPLEMENTS" -> fromAlias + " ..|> " + toAlias;
            case "USES" -> fromAlias + " ..> " + toAlias + " : uses";
            case "ONE_TO_ONE" -> fromAlias + " \"1\" -- \"1\" " + toAlias;
            case "ONE_TO_MANY" -> fromAlias + " \"1\" --> \"*\" " + toAlias;
            case "MANY_TO_ONE" -> fromAlias + " \"*\" --> \"1\" " + toAlias;
            case "MANY_TO_MANY" -> fromAlias + " \"*\" --> \"*\" " + toAlias;
            default -> fromAlias + " --> " + toAlias;
        };
    }

    // PlantUML aliases must be plain identifiers — qualified names (dots) aren't valid unquoted.
    private String alias(String qualifiedName) {
        if (qualifiedName == null) return "_";
        return qualifiedName.replaceAll("[^A-Za-z0-9_]", "_");
    }
}
