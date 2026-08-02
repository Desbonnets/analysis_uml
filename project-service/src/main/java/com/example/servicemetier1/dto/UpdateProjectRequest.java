package com.example.servicemetier1.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateProjectRequest {
    private String name;
    private String description;
    private List<String> languages;
    private String status;
    private Integer score;
    private Integer diagramsCount;
    private Integer violationsCount;
    private String repositoryUrl;
    private String logoUrl;
}
