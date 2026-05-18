package com.example.servicemetier1.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private String language;
    private String status;
    private String ownerEmail;
    private String ownerName;
    private int score;
    private int diagramsCount;
    private int violationsCount;
    private String repositoryUrl;
    private boolean hasApiToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ProjectMemberDto> members;
}
