package com.example.servicemetier1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CreateProjectRequest {
    @NotBlank(message = "Le nom est requis")
    private String name;

    private String description;

    @NotEmpty(message = "Au moins un langage est requis")
    private List<String> languages;

    private String repositoryUrl;

    private String logoUrl;
}
