package com.example.servicemetier1.service;

import com.example.servicemetier1.dto.AddMemberRequest;
import com.example.servicemetier1.dto.CreateProjectRequest;
import com.example.servicemetier1.dto.GenerateTokenResponse;
import com.example.servicemetier1.dto.ProjectDto;
import com.example.servicemetier1.dto.ProjectMemberDto;
import com.example.servicemetier1.dto.SubmitAnalysisRequest;
import com.example.servicemetier1.dto.UpdateProjectRequest;
import com.example.servicemetier1.entity.Project;
import com.example.servicemetier1.entity.ProjectMember;
import com.example.servicemetier1.repository.ProjectMemberRepository;
import com.example.servicemetier1.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    public List<ProjectDto> findAll(String requesterEmail) {
        return projectRepository.findByMemberEmail(requesterEmail).stream()
                .map(this::toDto).collect(Collectors.toList());
    }

    public ProjectDto findById(Long id, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!memberRepository.existsByProjectIdAndUserEmail(id, requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        return toDto(project);
    }

    @Transactional
    public ProjectDto create(CreateProjectRequest req, String ownerEmail, String ownerName) {
        String resolvedName = ownerName != null ? ownerName : ownerEmail;
        Project project = Project.builder()
                .name(req.getName())
                .description(req.getDescription())
                .languages(req.getLanguages())
                .repositoryUrl(req.getRepositoryUrl())
                .logoUrl(req.getLogoUrl())
                .ownerEmail(ownerEmail)
                .ownerName(resolvedName)
                .build();
        Project saved = projectRepository.save(project);
        memberRepository.save(ProjectMember.builder()
                .project(saved)
                .userEmail(ownerEmail)
                .userName(resolvedName)
                .role("owner")
                .build());
        return toDto(saved);
    }

    @Transactional
    public ProjectDto update(Long id, UpdateProjectRequest req, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        if (req.getName() != null) project.setName(req.getName());
        if (req.getDescription() != null) project.setDescription(req.getDescription());
        if (req.getLanguages() != null && !req.getLanguages().isEmpty()) project.setLanguages(req.getLanguages());
        if (req.getStatus() != null) project.setStatus(req.getStatus());
        if (req.getScore() != null) project.setScore(req.getScore());
        if (req.getDiagramsCount() != null) project.setDiagramsCount(req.getDiagramsCount());
        if (req.getViolationsCount() != null) project.setViolationsCount(req.getViolationsCount());
        if (req.getRepositoryUrl() != null) project.setRepositoryUrl(req.getRepositoryUrl());
        if (req.getLogoUrl() != null) project.setLogoUrl(req.getLogoUrl().isBlank() ? null : req.getLogoUrl());
        return toDto(projectRepository.save(project));
    }

    @Transactional
    public GenerateTokenResponse generateToken(Long id, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        String token = UUID.randomUUID().toString();
        project.setApiToken(token);
        projectRepository.save(project);
        return new GenerateTokenResponse(token);
    }

    @Transactional
    public void submitAnalysis(Long id, String token, SubmitAnalysisRequest req) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (project.getApiToken() == null || !project.getApiToken().equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token invalide");
        }
        if (req.getScore() != null) project.setScore(req.getScore());
        if (req.getViolationsCount() != null) project.setViolationsCount(req.getViolationsCount());
        if (req.getDiagramsCount() != null) project.setDiagramsCount(req.getDiagramsCount());
        project.setStatus(req.getStatus() != null ? req.getStatus() : "analyzed");
        projectRepository.save(project);
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        projectRepository.delete(project);
    }

    // ── Member management ──────────────────────────────────────────────────────

    public List<ProjectMemberDto> getMembers(Long projectId, String requesterEmail) {
        if (!memberRepository.existsByProjectIdAndUserEmail(projectId, requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        return memberRepository.findByProjectId(projectId).stream()
                .map(m -> new ProjectMemberDto(m.getUserEmail(), m.getUserName(), m.getRole()))
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectMemberDto addMember(Long projectId, AddMemberRequest req, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le propriétaire peut ajouter des membres");
        }
        if (memberRepository.existsByProjectIdAndUserEmail(projectId, req.userEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cet utilisateur est déjà membre du projet");
        }
        ProjectMember member = memberRepository.save(ProjectMember.builder()
                .project(project)
                .userEmail(req.userEmail())
                .userName(req.userName() != null ? req.userName() : req.userEmail())
                .role("member")
                .build());
        return new ProjectMemberDto(member.getUserEmail(), member.getUserName(), member.getRole());
    }

    @Transactional
    public void removeMember(Long projectId, String memberEmail, String requesterEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projet introuvable"));
        if (!project.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le propriétaire peut retirer des membres");
        }
        if (memberEmail.equals(project.getOwnerEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le propriétaire ne peut pas être retiré du projet");
        }
        if (!memberRepository.existsByProjectIdAndUserEmail(projectId, memberEmail)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Membre introuvable");
        }
        memberRepository.deleteByProjectIdAndUserEmail(projectId, memberEmail);
    }

    private ProjectDto toDto(Project p) {
        List<ProjectMemberDto> members = memberRepository.findByProjectId(p.getId()).stream()
                .map(m -> new ProjectMemberDto(m.getUserEmail(), m.getUserName(), m.getRole()))
                .collect(Collectors.toList());
        return ProjectDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .languages(p.getLanguages())
                .status(p.getStatus())
                .ownerEmail(p.getOwnerEmail())
                .ownerName(p.getOwnerName())
                .score(p.getScore())
                .diagramsCount(p.getDiagramsCount())
                .violationsCount(p.getViolationsCount())
                .repositoryUrl(p.getRepositoryUrl())
                .logoUrl(p.getLogoUrl())
                .hasApiToken(p.getApiToken() != null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .members(members)
                .build();
    }
}
