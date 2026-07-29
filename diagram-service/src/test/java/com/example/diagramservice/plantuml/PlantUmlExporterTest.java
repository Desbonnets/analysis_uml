package com.example.diagramservice.plantuml;

import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
import com.example.diagramservice.dto.PackageNode;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PlantUmlExporterTest {

    private final PlantUmlExporter exporter = new PlantUmlExporter();

    private DiagramNode node(String name, String qualifiedName, String type) {
        return DiagramNode.builder()
                .id(qualifiedName).name(name).qualifiedName(qualifiedName).type(type)
                .fields(List.of()).methods(List.of())
                .build();
    }

    @Test
    void wrapsSourceInStartEndUml() {
        String source = exporter.exportClassDiagram(List.of(), List.of());

        assertThat(source).startsWith("@startuml").contains("@enduml");
    }

    @Test
    void mapsNodeTypesToPlantUmlKeywords() {
        List<DiagramNode> nodes = List.of(
                node("Order", "com.example.Order", "CLASS"),
                node("Payment", "com.example.Payment", "ABSTRACT_CLASS"),
                node("Shippable", "com.example.Shippable", "INTERFACE"),
                node("Status", "com.example.Status", "ENUM")
        );

        String source = exporter.exportClassDiagram(nodes, List.of());

        assertThat(source)
                .contains("class \"Order\" as")
                .contains("abstract class \"Payment\" as")
                .contains("interface \"Shippable\" as")
                .contains("enum \"Status\" as");
    }

    @Test
    void rendersFieldsAndMethodsInsideClassBody() {
        DiagramNode order = DiagramNode.builder()
                .id("com.example.Order").name("Order").qualifiedName("com.example.Order").type("CLASS")
                .fields(List.of("+ id: Long"))
                .methods(List.of("+ place(): void"))
                .build();

        String source = exporter.exportClassDiagram(List.of(order), List.of());

        assertThat(source).contains("+ id: Long").contains("--").contains("+ place(): void");
    }

    @Test
    void mapsEdgeTypesToPlantUmlArrows() {
        List<DiagramNode> nodes = List.of(
                node("OnlineOrder", "OnlineOrder", "CLASS"),
                node("Order", "Order", "CLASS"),
                node("Shippable", "Shippable", "INTERFACE"),
                node("Helper", "Helper", "CLASS")
        );
        List<DiagramEdge> edges = List.of(
                DiagramEdge.builder().from("OnlineOrder").to("Order").type("EXTENDS").build(),
                DiagramEdge.builder().from("OnlineOrder").to("Shippable").type("IMPLEMENTS").build(),
                DiagramEdge.builder().from("OnlineOrder").to("Helper").type("USES").build(),
                DiagramEdge.builder().from("OnlineOrder").to("Order").type("ONE_TO_MANY").build()
        );

        String source = exporter.exportClassDiagram(nodes, edges);

        assertThat(source)
                .contains("--|>")
                .contains("..|>")
                .contains("..> Helper")
                .contains("\"1\" --> \"*\"");
    }

    @Test
    void exportedClassDiagramRoundTripsThroughParser() {
        List<DiagramNode> nodes = List.of(
                node("OnlineOrder", "com.example.OnlineOrder", "CLASS"),
                node("Order", "com.example.Order", "CLASS")
        );
        List<DiagramEdge> edges = List.of(
                DiagramEdge.builder().from("com.example.OnlineOrder").to("com.example.Order").type("EXTENDS").build()
        );

        String source = exporter.exportClassDiagram(nodes, edges);
        var parsed = new PlantUmlParser().parse(source);

        assertThat(parsed.classTypes()).containsEntry("OnlineOrder", "CLASS").containsEntry("Order", "CLASS");
        assertThat(parsed.relations()).contains(new PlantUmlParser.ParsedRelation("OnlineOrder", "Order", "EXTENDS"));
    }

    @Test
    void exportsPackageDiagramWithClassesAndDependencyArrows() {
        List<PackageNode> packages = List.of(
                PackageNode.builder().name("com.example.orders").classCount(1).classes(List.of("Order")).dependsOn(List.of("com.example.payments")).build(),
                PackageNode.builder().name("com.example.payments").classCount(1).classes(List.of("Payment")).dependsOn(List.of()).build()
        );
        List<DiagramEdge> edges = List.of(
                DiagramEdge.builder().from("com.example.orders").to("com.example.payments").type("DEPENDS_ON").build()
        );

        String source = exporter.exportPackageDiagram(packages, edges);

        assertThat(source)
                .contains("package \"com.example.orders\"")
                .contains("class \"Order\"")
                .contains("package \"com.example.payments\"")
                .contains("\"com.example.orders\" ..> \"com.example.payments\"");
    }
}
