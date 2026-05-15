package com.example.analysisservice.service;

import com.example.analysisservice.dto.AnalysisResponse;
import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.Language;
import com.example.analysisservice.parser.ParserFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private static final long MAX_SIZE_BYTES = 50L * 1024 * 1024;
    private static final String ZIP_CONTENT_TYPE = "application/zip";
    private static final String ZIP_CONTENT_TYPE_ALT = "application/x-zip-compressed";

    private final StorageService storageService;
    private final ZipExtractorService zipExtractorService;
    private final ParserFactory parserFactory;

    public AnalysisResponse upload(Long projectId, MultipartFile file) {
        validateFile(file);

        byte[] zipContent = readBytes(file);
        String storageKey = storageService.upload(projectId, zipContent);

        List<CodeUnit> codeUnits = analyzeZip(projectId, zipContent);
        int classesFound = codeUnits.stream().mapToInt(u -> u.getClasses().size()).sum();

        log.info("Project {} — {} files parsed, {} classes found", projectId, codeUnits.size(), classesFound);

        return AnalysisResponse.builder()
                .projectId(projectId)
                .storageKey(storageKey)
                .status("analyzed")
                .message("Analyse terminée : " + codeUnits.size() + " fichier(s), " + classesFound + " classe(s) détectée(s).")
                .filesAnalyzed(codeUnits.size())
                .classesFound(classesFound)
                .codeUnits(codeUnits)
                .build();
    }

    private List<CodeUnit> analyzeZip(Long projectId, byte[] zipContent) {
        try {
            Map<String, byte[]> sourceFiles =
                    zipExtractorService.extractSourceFiles(new ByteArrayInputStream(zipContent));

            Map<Language, Map<String, byte[]>> byLanguage = sourceFiles.entrySet().stream()
                    .collect(Collectors.groupingBy(
                            e -> parserFactory.detectLanguage(e.getKey()),
                            Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)
                    ));

            byLanguage.remove(Language.UNKNOWN);

            return byLanguage.entrySet().stream()
                    .flatMap(e -> parserFactory.getParser(e.getKey())
                            .map(parser -> {
                                try {
                                    return parser.parse(e.getValue());
                                } catch (IOException ex) {
                                    log.warn("Parser failed for {}: {}", e.getKey(), ex.getMessage());
                                    return List.<CodeUnit>of();
                                }
                            })
                            .orElseGet(() -> {
                                log.debug("No parser registered for language {}", e.getKey());
                                return List.<CodeUnit>of();
                            })
                            .stream())
                    .toList();

        } catch (IOException e) {
            log.warn("Project {} — could not read ZIP: {}", projectId, e.getMessage());
            return List.of();
        }
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Impossible de lire le fichier");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucun fichier fourni");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Fichier trop volumineux (max 50 Mo)");
        }
        String contentType = file.getContentType();
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        boolean isZip = ZIP_CONTENT_TYPE.equals(contentType)
                || ZIP_CONTENT_TYPE_ALT.equals(contentType)
                || name.toLowerCase().endsWith(".zip");
        if (!isZip) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le fichier doit être une archive ZIP");
        }
    }
}
