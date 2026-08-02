package com.example.servicemetier1.controller;

import com.example.servicemetier1.dto.AddMemberRequest;
import com.example.servicemetier1.dto.CreateProjectRequest;
import com.example.servicemetier1.dto.GenerateTokenResponse;
import com.example.servicemetier1.dto.ProjectDto;
import com.example.servicemetier1.dto.ProjectMemberDto;
import com.example.servicemetier1.dto.SubmitAnalysisRequest;
import com.example.servicemetier1.dto.UpdateProjectRequest;
import com.example.servicemetier1.security.SuperAdminGuard;
import com.example.servicemetier1.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final SuperAdminGuard superAdminGuard;

    @GetMapping
    public List<ProjectDto> getAll(Authentication auth) {
        return projectService.findAll(auth.getName(), superAdminGuard.isSuperAdmin(auth));
    }

    @GetMapping("/{id}")
    public ProjectDto getById(@PathVariable Long id, Authentication auth) {
        return projectService.findById(id, auth.getName(), superAdminGuard.isSuperAdmin(auth));
    }

    @PostMapping
    public ResponseEntity<ProjectDto> create(
            @Valid @RequestBody CreateProjectRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(req, auth.getName(), null));
    }

    @PutMapping("/{id}")
    public ProjectDto update(
            @PathVariable Long id,
            @RequestBody UpdateProjectRequest req,
            Authentication auth) {
        return projectService.update(id, req, auth.getName(), superAdminGuard.isSuperAdmin(auth));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        projectService.delete(id, auth.getName(), superAdminGuard.isSuperAdmin(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/token")
    public ResponseEntity<GenerateTokenResponse> generateToken(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(projectService.generateToken(id, auth.getName(), superAdminGuard.isSuperAdmin(auth)));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> submitReport(
            @PathVariable Long id,
            @RequestHeader("X-Project-Token") String token,
            @RequestBody SubmitAnalysisRequest req) {
        projectService.submitAnalysis(id, token, req);
        return ResponseEntity.ok().build();
    }

    // ── Member endpoints ───────────────────────────────────────────────────────

    @GetMapping("/{id}/members")
    public List<ProjectMemberDto> getMembers(@PathVariable Long id, Authentication auth) {
        return projectService.getMembers(id, auth.getName(), superAdminGuard.isSuperAdmin(auth));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectMemberDto> addMember(
            @PathVariable Long id,
            @Valid @RequestBody AddMemberRequest req,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addMember(id, req, auth.getName(), superAdminGuard.isSuperAdmin(auth)));
    }

    @DeleteMapping("/{id}/members/{memberEmail}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long id,
            @PathVariable String memberEmail,
            Authentication auth) {
        projectService.removeMember(id, memberEmail, auth.getName(), superAdminGuard.isSuperAdmin(auth));
        return ResponseEntity.noContent().build();
    }
}
