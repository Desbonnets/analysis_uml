package com.example.diagramservice.controller;

import com.example.diagramservice.dto.CreateSavedUmlDiagramRequest;
import com.example.diagramservice.dto.SavedUmlDiagramDto;
import com.example.diagramservice.dto.UpdateSavedUmlDiagramRequest;
import com.example.diagramservice.service.SavedUmlDiagramService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/diagrams/saved-umls")
@RequiredArgsConstructor
public class SavedUmlDiagramController {

    private final SavedUmlDiagramService savedUmlDiagramService;

    @GetMapping
    public List<SavedUmlDiagramDto> listAll(@RequestParam(required = false) Long projectId) {
        return savedUmlDiagramService.listAll(projectId);
    }

    @GetMapping("/{id}")
    public SavedUmlDiagramDto getById(@PathVariable Long id) {
        return savedUmlDiagramService.getById(id);
    }

    @PostMapping
    public ResponseEntity<SavedUmlDiagramDto> create(@Valid @RequestBody CreateSavedUmlDiagramRequest req, Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUmlDiagramService.create(req, auth.getName()));
    }

    @PutMapping("/{id}")
    public SavedUmlDiagramDto update(@PathVariable Long id, @Valid @RequestBody UpdateSavedUmlDiagramRequest req, Authentication auth) {
        return savedUmlDiagramService.update(id, req, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication auth) {
        savedUmlDiagramService.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
