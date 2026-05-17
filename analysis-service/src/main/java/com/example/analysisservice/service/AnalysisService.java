package com.example.analysisservice.service;

import com.example.analysisservice.dto.AnalysisResponse;
import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.Language;
import com.example.analysisservice.parser.ParserFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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

    private static final String ZIP_CONTENT_TYPE = "application/zip";
    private static final String ZIP_CONTENT_TYPE_ALT = "application/x-zip-compressed";

    private final StorageService storageService;
    private final ZipExtractorService zipExtractorService;
    private final ParserFactory parserFactory;

    @Value("${analysis.upload.max-size-mb:200}")
    private long maxSizeMb;

    public AnalysisResponse upload(Long projectId, MultipartFile file) {
        validateFile(file);

        byte[] zipContent = readBytes(file);
        String storageKey = storageService.upload(projectId, zipContent);

        List<String> unsupportedLanguages = new java.util.ArrayList<>();
        List<CodeUnit> codeUnits = analyzeZip(projectId, zipContent, unsupportedLanguages);
        int classesFound = codeUnits.stream().mapToInt(u -> u.getClasses().size()).sum();

        log.info("Project {} — {} files parsed, {} classes found, unsupported: {}",
                projectId, codeUnits.size(), classesFound, unsupportedLanguages);

        return AnalysisResponse.builder()
                .projectId(projectId)
                .storageKey(storageKey)
                .status("analyzed")
                .message(buildMessage(codeUnits.size(), classesFound, unsupportedLanguages))
                .filesAnalyzed(codeUnits.size())
                .classesFound(classesFound)
                .codeUnits(codeUnits)
                .unsupportedLanguages(unsupportedLanguages)
                .build();
    }

    private String buildMessage(int filesAnalyzed, int classesFound, List<String> unsupportedLanguages) {
        StringBuilder sb = new StringBuilder();
        sb.append("Analyse terminée : ")
          .append(filesAnalyzed).append(" fichier(s), ")
          .append(classesFound).append(" classe(s) détectée(s).");
        if (!unsupportedLanguages.isEmpty()) {
            sb.append(" Langage(s) non supporté(s) : ")
              .append(String.join(", ", unsupportedLanguages)).append(".");
        }
        return sb.toString();
    }

    private List<CodeUnit> analyzeZip(Long projectId, byte[] zipContent, List<String> unsupportedLanguages) {
        try {
            Map<String, byte[]> sourceFiles =
                    zipExtractorService.extractSourceFiles(new ByteArrayInputStream(zipContent));

            Map<Language, Map<String, byte[]>> byLanguage = sourceFiles.entrySet().stream()
                    .collect(Collectors.groupingBy(
                            e -> parserFactory.detectLanguage(e.getKey()),
                            Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)
                    ));

            byLanguage.remove(Language.UNKNOWN);

            if (byLanguage.isEmpty()) {
                log.info("Project {} — no recognised language in ZIP (extensions found: {})",
                        projectId,
                        sourceFiles.keySet().stream()
                                .map(f -> { int d = f.lastIndexOf('.'); return d >= 0 ? f.substring(d) : "(none)"; })
                                .distinct().sorted().toList());
            } else {
                byLanguage.forEach((lang, files) ->
                        log.info("Project {} — {} {} file(s) to parse", projectId, files.size(), lang));
            }

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
                                log.info("No parser registered for language {}", e.getKey());
                                unsupportedLanguages.add(e.getKey().name().toLowerCase());
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
        long maxBytes = maxSizeMb * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Fichier trop volumineux (max " + maxSizeMb + " Mo)");
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
