package com.example.servicemetier1.controller;

import com.example.servicemetier1.dto.CreateProjectRequest;
import com.example.servicemetier1.dto.GenerateTokenResponse;
import com.example.servicemetier1.dto.ProjectDto;
import com.example.servicemetier1.dto.SubmitAnalysisRequest;
import com.example.servicemetier1.dto.UpdateProjectRequest;
import com.example.servicemetier1.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public List<ProjectDto> getAll() {
        return projectService.findAll();
    }

    @GetMapping("/{id}")
    public ProjectDto getById(@PathVariable Long id) {
        return projectService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ProjectDto> create(
            @Valid @RequestBody CreateProjectRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProjectDto created = projectService.create(req, userDetails.getUsername(), null);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ProjectDto update(
            @PathVariable Long id,
            @RequestBody UpdateProjectRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return projectService.update(id, req, userDetails.getUsername());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        projectService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/token")
    public ResponseEntity<GenerateTokenResponse> generateToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(projectService.generateToken(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<Void> submitReport(
            @PathVariable Long id,
            @RequestHeader("X-Project-Token") String token,
            @RequestBody SubmitAnalysisRequest req) {
        projectService.submitAnalysis(id, token, req);
        return ResponseEntity.ok().build();
    }
}
