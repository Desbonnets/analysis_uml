package com.example.diagramservice.service;

import com.example.diagramservice.dto.CreateSavedUmlDiagramRequest;
import com.example.diagramservice.dto.SavedUmlDiagramDto;
import com.example.diagramservice.dto.UpdateSavedUmlDiagramRequest;
import com.example.diagramservice.entity.SavedUmlDiagram;
import com.example.diagramservice.repository.SavedUmlDiagramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavedUmlDiagramService {

    private final SavedUmlDiagramRepository repository;

    public List<SavedUmlDiagramDto> listAll(Long projectIdFilter) {
        List<SavedUmlDiagram> diagrams = projectIdFilter != null
                ? repository.findByProjectIdOrderByUpdatedAtDesc(projectIdFilter)
                : repository.findAllByOrderByUpdatedAtDesc();
        return diagrams.stream().map(this::toDto).collect(Collectors.toList());
    }

    public SavedUmlDiagramDto getById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public SavedUmlDiagramDto create(CreateSavedUmlDiagramRequest req, String ownerEmail) {
        SavedUmlDiagram diagram = SavedUmlDiagram.builder()
                .name(req.getName())
                .projectId(req.getProjectId())
                .plantUmlSource(req.getSource())
                .ownerEmail(ownerEmail)
                .build();
        return toDto(repository.save(diagram));
    }

    @Transactional
    public SavedUmlDiagramDto update(Long id, UpdateSavedUmlDiagramRequest req, String requesterEmail) {
        SavedUmlDiagram diagram = findOrThrow(id);
        if (!diagram.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        diagram.setName(req.getName());
        diagram.setProjectId(req.getProjectId());
        diagram.setPlantUmlSource(req.getSource());
        return toDto(repository.save(diagram));
    }

    @Transactional
    public void delete(Long id, String requesterEmail) {
        SavedUmlDiagram diagram = findOrThrow(id);
        if (!diagram.getOwnerEmail().equals(requesterEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        }
        repository.delete(diagram);
    }

    private SavedUmlDiagram findOrThrow(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Diagramme UML introuvable"));
    }

    private SavedUmlDiagramDto toDto(SavedUmlDiagram d) {
        return SavedUmlDiagramDto.builder()
                .id(d.getId())
                .name(d.getName())
                .projectId(d.getProjectId())
                .plantUmlSource(d.getPlantUmlSource())
                .ownerEmail(d.getOwnerEmail())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
