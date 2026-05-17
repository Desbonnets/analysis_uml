package com.example.servicemetier1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private String language;

    @Column(nullable = false)
    @Builder.Default
    private String status = "new";

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @Column(name = "owner_name")
    private String ownerName;

    @Builder.Default
    private int score = 0;

    @Column(name = "diagrams_count")
    @Builder.Default
    private int diagramsCount = 0;

    @Column(name = "violations_count")
    @Builder.Default
    private int violationsCount = 0;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "api_token", unique = true)
    private String apiToken;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
