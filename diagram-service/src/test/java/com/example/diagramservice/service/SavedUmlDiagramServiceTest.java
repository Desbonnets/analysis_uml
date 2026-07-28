package com.example.diagramservice.service;

import com.example.diagramservice.dto.CreateSavedUmlDiagramRequest;
import com.example.diagramservice.dto.SavedUmlDiagramDto;
import com.example.diagramservice.dto.UpdateSavedUmlDiagramRequest;
import com.example.diagramservice.entity.SavedUmlDiagram;
import com.example.diagramservice.repository.SavedUmlDiagramRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SavedUmlDiagramServiceTest {

    @Mock
    private SavedUmlDiagramRepository repository;

    private SavedUmlDiagramService service() {
        return new SavedUmlDiagramService(repository);
    }

    private SavedUmlDiagram entity(Long id, String ownerEmail) {
        return SavedUmlDiagram.builder()
                .id(id)
                .name("Modèle")
                .projectId(1L)
                .plantUmlSource("class Order")
                .ownerEmail(ownerEmail)
                .build();
    }

    @Test
    void createsDiagramOwnedByRequester() {
        CreateSavedUmlDiagramRequest req = new CreateSavedUmlDiagramRequest();
        req.setName("Modèle");
        req.setProjectId(1L);
        req.setSource("class Order");

        when(repository.save(any())).thenAnswer(inv -> {
            SavedUmlDiagram d = inv.getArgument(0);
            d.setId(1L);
            return d;
        });

        SavedUmlDiagramDto dto = service().create(req, "alice@dev.local");

        assertThat(dto.getId()).isEqualTo(1L);
        assertThat(dto.getOwnerEmail()).isEqualTo("alice@dev.local");
        assertThat(dto.getPlantUmlSource()).isEqualTo("class Order");
    }

    @Test
    void updateRejectsNonOwner() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity(1L, "alice@dev.local")));
        UpdateSavedUmlDiagramRequest req = new UpdateSavedUmlDiagramRequest();
        req.setName("Autre nom");
        req.setSource("class Order");

        assertThatThrownBy(() -> service().update(1L, req, "bob@dev.local"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void deleteRejectsNonOwner() {
        when(repository.findById(1L)).thenReturn(Optional.of(entity(1L, "alice@dev.local")));

        assertThatThrownBy(() -> service().delete(1L, "bob@dev.local"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403");
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().getById(99L))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void listAllFiltersByProjectWhenProvided() {
        when(repository.findByProjectIdOrderByUpdatedAtDesc(1L))
                .thenReturn(List.of(entity(1L, "alice@dev.local")));

        List<SavedUmlDiagramDto> result = service().listAll(1L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectId()).isEqualTo(1L);
    }
}
