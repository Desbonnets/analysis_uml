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
        when(classDiagramService.generate(anyLong(), any(), isNull(), eq("Bearer t"))).thenReturn(actual);
        return new ConformanceService(classDiagramService, new PlantUmlParser());
    }

    private DiagramNode node(String name, String type) {
        return DiagramNode.builder().id(name).name(name).qualifiedName(name).type(type)
                .fields(List.of()).methods(List.of()).build();
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
}
