package com.example.diagramservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateSavedUmlDiagramRequest {
    @NotBlank(message = "Le nom est requis")
    private String name;

    private Long projectId;

    @NotBlank(message = "Le source PlantUML est requis")
    private String source;
}
