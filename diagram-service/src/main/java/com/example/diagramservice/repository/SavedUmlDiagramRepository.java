package com.example.diagramservice.repository;

import com.example.diagramservice.entity.SavedUmlDiagram;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SavedUmlDiagramRepository extends JpaRepository<SavedUmlDiagram, Long> {

    List<SavedUmlDiagram> findAllByOrderByUpdatedAtDesc();

    List<SavedUmlDiagram> findByProjectIdOrderByUpdatedAtDesc(Long projectId);
}
