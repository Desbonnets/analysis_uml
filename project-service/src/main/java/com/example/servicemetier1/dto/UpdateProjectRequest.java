package com.example.servicemetier1.dto;

import lombok.Data;

@Data
public class UpdateProjectRequest {
    private String name;
    private String description;
    private String language;
    private String status;
    private Integer score;
    private Integer diagramsCount;
    private Integer violationsCount;
    private String repositoryUrl;
}
