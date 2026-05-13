package com.example.servicemetier1.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "Le nom est requis")
    private String name;

    private String description;

    @NotBlank(message = "Le langage est requis")
    private String language;
}
