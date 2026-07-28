package com.example.diagramservice.plantuml;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlantUmlParserTest {

    private final PlantUmlParser parser = new PlantUmlParser();

    @Test
    void parsesDeclarations() {
        String source = """
                @startuml
                class Order
                abstract class Payment
                interface Shippable
                enum Status
                @enduml
                """;

        var result = parser.parse(source);

        assertThat(result.classTypes())
                .containsEntry("Order", "CLASS")
                .containsEntry("Payment", "ABSTRACT_CLASS")
                .containsEntry("Shippable", "INTERFACE")
                .containsEntry("Status", "ENUM");
    }

    @Test
    void parsesExtendsAndImplements() {
        String source = """
                class Order
                class OnlineOrder
                interface Shippable
                OnlineOrder --|> Order
                OnlineOrder ..|> Shippable
                """;

        var result = parser.parse(source);

        assertThat(result.relations()).contains(
                new PlantUmlParser.ParsedRelation("OnlineOrder", "Order", "EXTENDS"),
                new PlantUmlParser.ParsedRelation("OnlineOrder", "Shippable", "IMPLEMENTS")
        );
    }

    @Test
    void foldsAssociationVariantsIntoOneBucket() {
        String source = """
                class Order
                class Customer
                class Line
                Order --> Customer
                Order *-- Line
                """;

        var result = parser.parse(source);

        assertThat(result.relations()).contains(
                new PlantUmlParser.ParsedRelation("Order", "Customer", "ASSOCIATION"),
                new PlantUmlParser.ParsedRelation("Order", "Line", "ASSOCIATION")
        );
    }

    @Test
    void resolvesAliases() {
        String source = """
                class "com.example.Order" as Order
                class "com.example.Customer" as Customer
                Order --> Customer
                """;

        var result = parser.parse(source);

        assertThat(result.classTypes()).containsKey("com.example.Order");
        assertThat(result.relations()).contains(
                new PlantUmlParser.ParsedRelation("com.example.Order", "com.example.Customer", "ASSOCIATION")
        );
    }

    @Test
    void skipsUnrecognizedLines() {
        String source = """
                @startuml
                skinparam classAttributeIconSize 0
                ' a comment
                package "com.example" {
                  class Order
                }
                note right of Order: some note
                @enduml
                """;

        var result = parser.parse(source);

        assertThat(result.classTypes()).containsOnlyKeys("Order");
        assertThat(result.relations()).isEmpty();
    }
}
