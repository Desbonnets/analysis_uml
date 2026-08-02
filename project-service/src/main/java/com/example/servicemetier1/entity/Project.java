package com.example.servicemetier1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "members")
@ToString(exclude = "members")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "project_languages", joinColumns = @JoinColumn(name = "project_id"))
    @Column(name = "language", nullable = false)
    @Builder.Default
    private List<String> languages = new ArrayList<>();

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

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

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectMember> members = new ArrayList<>();

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
