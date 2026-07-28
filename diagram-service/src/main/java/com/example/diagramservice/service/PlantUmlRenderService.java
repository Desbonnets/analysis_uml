package com.example.diagramservice.service;

import com.example.diagramservice.dto.PlantUmlRenderDto;
import net.sourceforge.plantuml.FileFormat;
import net.sourceforge.plantuml.FileFormatOption;
import net.sourceforge.plantuml.SourceStringReader;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Renders arbitrary PlantUML class-diagram source into SVG using the official PlantUML
 * engine (local Java library, no network call) — gives full support for the class diagram
 * syntax (visibility, generics, all relation/arrow variants, notes, packages, colors,
 * hide/show, ...) instead of re-implementing the grammar by hand.
 */
@Service
public class PlantUmlRenderService {

    public PlantUmlRenderDto render(String source) {
        if (source == null || source.isBlank()) {
            return PlantUmlRenderDto.builder().svg(null).build();
        }

        String wrapped = wrapIfNeeded(source);
        SourceStringReader reader = new SourceStringReader(wrapped);
        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            reader.outputImage(os, new FileFormatOption(FileFormat.SVG));
            return PlantUmlRenderDto.builder().svg(os.toString(StandardCharsets.UTF_8)).build();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Impossible de générer le diagramme PlantUML");
        }
    }

    private String wrapIfNeeded(String source) {
        String trimmed = source.trim();
        if (trimmed.startsWith("@startuml")) return source;
        return "@startuml\n" + source + "\n@enduml";
    }
}
