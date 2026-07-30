package com.example.diagramservice.service;

import com.example.diagramservice.dto.ClassDiagramDto;
import com.example.diagramservice.dto.ConformanceReportDto;
import com.example.diagramservice.dto.ConformanceViolation;
import com.example.diagramservice.dto.DiagramEdge;
import com.example.diagramservice.dto.DiagramNode;
import com.example.diagramservice.plantuml.PlantUmlParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConformanceServiceTest {

    @Mock
    private ClassDiagramService classDiagramService;

    private final ConformanceService conformanceService(ClassDiagramDto actual) {
        when(classDiagramService.generate(anyLong(), any(), isNull(), isNull(), isNull(), eq("Bearer t"))).thenReturn(actual);
        return new ConformanceService(classDiagramService, new PlantUmlParser());
    }

    private DiagramNode node(String name, String type) {
        return DiagramNode.builder().id(name).name(name).qualifiedName(name).type(type)
                .fields(List.of()).methods(List.of()).build();
    }

    private DiagramNode node(String name, String type, List<String> fields, List<String> methods) {
        return DiagramNode.builder().id(name).name(name).qualifiedName(name).type(type)
                .fields(fields).methods(methods).build();
    }

    @Test
    void flagsMissingClass() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("Order", "CLASS")))
                .edges(List.of())
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class Order\nclass Customer", "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getClassName)
                .contains(org.assertj.core.groups.Tuple.tuple("MISSING_CLASS", "Customer"));
        assertThat(report.getErrorCount()).isEqualTo(1);
    }

    @Test
    void flagsTypeMismatch() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("Shippable", "CLASS")))
                .edges(List.of())
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "interface Shippable", "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType)
                .contains("TYPE_MISMATCH");
    }

    @Test
    void flagsMissingRelationButNotWhenEndpointAlreadyMissing() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("OnlineOrder", "CLASS"), node("Order", "CLASS")))
                .edges(List.of()) // no EXTENDS edge recorded
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class OnlineOrder\nclass Order\nOnlineOrder --|> Order", "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getClassName, ConformanceViolation::getRelatedClassName)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("MISSING_RELATION", "OnlineOrder", "Order"));
    }

    @Test
    void noViolationWhenEverythingMatches() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("OnlineOrder", "CLASS"), node("Order", "CLASS")))
                .edges(List.of(DiagramEdge.builder().from("OnlineOrder").to("Order").type("EXTENDS").build()))
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class OnlineOrder\nclass Order\nOnlineOrder --|> Order", "Bearer t");

        assertThat(report.getViolations()).isEmpty();
        assertThat(report.getErrorCount()).isZero();
    }

    @Test
    void flagsExtraClassAsInfo() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("Order", "CLASS"), node("InternalHelper", "CLASS")))
                .edges(List.of())
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class Order", "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getSeverity)
                .contains(org.assertj.core.groups.Tuple.tuple("EXTRA_CLASS", "INFO"));
        assertThat(report.getInfoCount()).isEqualTo(1);
        assertThat(report.getErrorCount()).isZero();
    }

    @Test
    void flagsFieldViolationsWhenCheckFieldsEnabled() {
        // Fixture from diagram-service/docs/conformance-precision.md: reference has
        // id/nom/prenom/email/password, actual is missing "prenom" and has an extra "region".
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("User", "CLASS", List.of(
                        "+ id: Long", "+ nom: String", "+ email: String", "+ password: String", "+ region: String"
                ), List.of())))
                .edges(List.of())
                .build();

        String reference = """
                class User {
                  +id: Long
                  +nom: String
                  +prenom: String
                  +email: String
                  +password: String
                }
                """;

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, reference, null, null, null, true, false, "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getMemberName)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("FIELD_MISSING", "prenom"),
                        org.assertj.core.groups.Tuple.tuple("EXTRA_FIELD", "region")
                );
    }

    @Test
    void doesNotCheckFieldsWhenFlagDisabled() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("User", "CLASS", List.of("+ id: Long"), List.of())))
                .edges(List.of())
                .build();

        String reference = """
                class User {
                  +id: Long
                  +prenom: String
                }
                """;

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, reference, "Bearer t");

        assertThat(report.getViolations()).isEmpty();
    }

    @Test
    void flagsFieldTypeMismatch() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("User", "CLASS", List.of("+ id: String"), List.of())))
                .edges(List.of())
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class User {\n+id: Long\n}", null, null, null, true, false, "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getMessage)
                .contains(org.assertj.core.groups.Tuple.tuple("FIELD_TYPE_MISMATCH",
                        "Type d'attribut incorrect pour User.id (attendu Long, trouvé String)"));
    }

    @Test
    void flagsMethodViolationsWhenCheckMethodsEnabled() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("User", "CLASS", List.of(), List.of(
                        "+ getId(): String", "+ ping(): void"
                ))))
                .edges(List.of())
                .build();

        String reference = """
                class User {
                  +getId(): Long
                  +getNom(): String
                }
                """;

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, reference, null, null, null, false, true, "Bearer t");

        assertThat(report.getViolations())
                .extracting(ConformanceViolation::getType, ConformanceViolation::getMemberName)
                .containsExactlyInAnyOrder(
                        org.assertj.core.groups.Tuple.tuple("METHOD_SIGNATURE_MISMATCH", "getId"),
                        org.assertj.core.groups.Tuple.tuple("METHOD_MISSING", "getNom"),
                        org.assertj.core.groups.Tuple.tuple("EXTRA_METHOD", "ping")
                );
    }

    @Test
    void skipsMemberCheckWhenReferenceClassHasNoBody() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("User", "CLASS", List.of("+ region: String"), List.of())))
                .edges(List.of())
                .build();

        ConformanceReportDto report = conformanceService(actual)
                .generate(1L, null, "class User", null, null, null, true, true, "Bearer t");

        assertThat(report.getViolations()).isEmpty();
    }

    @Test
    void forwardsFiltersToClassDiagramService() {
        ClassDiagramDto actual = ClassDiagramDto.builder()
                .recordId("r1")
                .nodes(List.of(node("Order", "CLASS")))
                .edges(List.of())
                .build();

        when(classDiagramService.generate(eq(1L), isNull(), eq("entities"), eq("class,enum"), eq("com.example"), eq("Bearer t")))
                .thenReturn(actual);
        ConformanceService service = new ConformanceService(classDiagramService, new PlantUmlParser());

        ConformanceReportDto report = service.generate(1L, null, "class Order",
                "entities", "class,enum", "com.example", "Bearer t");

        assertThat(report.getViolations()).isEmpty();
    }
}
