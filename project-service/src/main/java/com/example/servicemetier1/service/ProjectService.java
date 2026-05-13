package com.example.servicemetier1.service;

import com.example.servicemetier1.dto.CreateProjectRequest;
import com.example.servicemetier1.dto.ProjectDto;
import com.example.servicemetier1.dto.UpdateProjectRequest;
import com.example.servicemetier1.entity.Project;
import com.example.servicemetier1.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public List<ProjectDto> findAll() {
        return projectRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public ProjectDto findById(Long id) {
        return projectRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
    }

    public ProjectDto create(CreateProjectRequest req, String ownerEmail, String ownerName) {
        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .language(req.getLanguage())
                .ownerEmail(ownerEmail)
                .ownerName(ownerName != null ? ownerName : ownerEmail)
                .build();
        return toDto(projectRepository.save(project));
    }

    public ProjectDto update(Long id, UpdateProjectRequest req, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        if (req.getName() != null) project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        if (req.getLanguage() != null) project.setLanguage(req.getLanguage());
        if (req.getStatus() != null) project.setStatus(req.getStatus());
        if (req.getScore() != null) project.setScore(req.getScore());
        if (req.getDiagramsCount() != null) project.setDiagramsCount(req.getDiagramsCount());
        if (req.getViolationsCount() != null) project.setViolationsCount(req.getViolationsCount());
        return toDto(projectRepository.save(project));
    }

    public void delete(Long id, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        projectRepository.delete(project);
    }

    private ProjectDto toDto(Project p) {
        return ProjectDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .language(p.getLanguage())
                .status(p.getStatus())
                .ownerEmail(p.getOwnerEmail())
                .ownerName(p.getOwnerName())
                .score(p.getScore())
                .diagramsCount(p.getDiagramsCount())
                .violationsCount(p.getViolationsCount())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
