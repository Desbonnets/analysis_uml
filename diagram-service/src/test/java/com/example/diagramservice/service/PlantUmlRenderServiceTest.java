package com.example.diagramservice.service;

import com.example.diagramservice.dto.PlantUmlRenderDto;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlantUmlRenderServiceTest {

    private final PlantUmlRenderService service = new PlantUmlRenderService();

    @Test
    void rendersSvgForSourceWithoutStartUmlTags() {
        PlantUmlRenderDto result = service.render("class Order\ninterface Shippable\nOrder ..|> Shippable");

        assertThat(result.getSvg()).isNotBlank();
        assertThat(result.getSvg()).contains("<svg");
    }

    @Test
    void rendersSvgForSourceAlreadyWrappedWithStartUmlTags() {
        PlantUmlRenderDto result = service.render("@startuml\nclass Order\n@enduml");

        assertThat(result.getSvg()).contains("<svg");
    }

    @Test
    void supportsFullClassDiagramSyntax() {
        String source = """
                abstract class Payment {
                  # amount : double
                  {abstract} void process()
                }
                interface Shippable
                enum Status {
                  PENDING
                  SHIPPED
                }
                class Order<T> {
                  + id : Long
                  - items : List<T>
                  + getTotal() : double
                  {static} int COUNT
                }
                note right of Order : Diagramme de référence
                Order "1" *-- "0..*" Status : a
                Order ..|> Shippable
                Order --|> Payment
                """;

        PlantUmlRenderDto result = service.render(source);

        assertThat(result.getSvg()).contains("<svg");
    }

    @Test
    void returnsNullSvgForBlankSource() {
        PlantUmlRenderDto result = service.render("   ");

        assertThat(result.getSvg()).isNull();
    }
}
