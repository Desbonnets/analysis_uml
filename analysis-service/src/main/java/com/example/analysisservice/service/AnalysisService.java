package com.example.analysisservice.service;

import com.example.analysisservice.dto.AnalysisHistoryEntry;
import com.example.analysisservice.dto.AnalysisRecord;
import com.example.analysisservice.dto.AnalysisResponse;
import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.Language;
import com.example.analysisservice.parser.ParserFactory;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final ObjectMapper objectMapper;

    @Value("${analysis.upload.max-size-mb:200}")
    private long maxSizeMb;

    // -------------------------------------------------------------------------
    // Upload + analyse
    // -------------------------------------------------------------------------

    public AnalysisResponse upload(Long projectId, String projectName, MultipartFile file) {
        validateFile(file);

        LocalDateTime now = LocalDateTime.now();
        String recordId = StorageService.newRecordId();

        byte[] zipContent = readBytes(file);
        String storageKey = storageService.upload(projectId, zipContent);

        List<String> unsupportedLanguages = new ArrayList<>();
        List<CodeUnit> codeUnits = analyzeZip(projectId, zipContent, unsupportedLanguages);
        int classesFound = codeUnits.stream().mapToInt(u -> u.getClasses().size()).sum();

        log.info("Project {} — {} files parsed, {} classes found, unsupported: {}",
                projectId, codeUnits.size(), classesFound, unsupportedLanguages);

        AnalysisResponse response = AnalysisResponse.builder()
                .recordId(recordId)
                .projectId(projectId)
                .storageKey(storageKey)
                .status("analyzed")
                .message(buildMessage(codeUnits.size(), classesFound, unsupportedLanguages))
                .filesAnalyzed(codeUnits.size())
                .classesFound(classesFound)
                .codeUnits(codeUnits)
                .unsupportedLanguages(unsupportedLanguages)
                .build();

        persistRecord(projectId, projectName, recordId, now, storageKey, response);

        return response;
    }

    // -------------------------------------------------------------------------
    // History
    // -------------------------------------------------------------------------

    /**
     * Returns a lightweight list of past analyses for a project, newest first.
     */
    public List<AnalysisHistoryEntry> listHistory(Long projectId) {
        List<String> keys = storageService.listRecordKeys(projectId);
        List<AnalysisHistoryEntry> entries = new ArrayList<>();

        for (String key : keys) {
            try {
                byte[] content = storageService.getRecordContent(key);
                JsonNode node = objectMapper.readTree(content);
                entries.add(entryFromNode(node));
            } catch (Exception e) {
                log.warn("Could not read history record {}: {}", key, e.getMessage());
            }
        }

        return entries;
    }

    /**
     * Returns the raw JSON bytes of a specific analysis record, or empty if not found.
     * The controller streams these bytes directly as application/json.
     */
    public Optional<byte[]> getHistoryRecordBytes(Long projectId, String recordId) {
        return storageService.findRecordKey(projectId, recordId).map(key -> {
            try {
                return storageService.getRecordContent(key);
            } catch (Exception e) {
                log.warn("Could not retrieve history record {} for project {}: {}",
                        recordId, projectId, e.getMessage());
                return null;
            }
        });
    }

    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------

    private void persistRecord(Long projectId, String projectName, String recordId,
                               LocalDateTime analyzedAt, String zipKey, AnalysisResponse response) {
        try {
            AnalysisRecord record = AnalysisRecord.builder()
                    .recordId(recordId)
                    .projectId(projectId)
                    .projectName(projectName)
                    .analyzedAt(analyzedAt)
                    .zipStorageKey(zipKey)
                    .filesAnalyzed(response.getFilesAnalyzed())
                    .classesFound(response.getClassesFound())
                    .unsupportedLanguages(response.getUnsupportedLanguages())
                    .codeUnits(response.getCodeUnits())
                    .build();

            byte[] json = objectMapper.writeValueAsBytes(record);
            storageService.saveRecord(projectId, projectName, recordId, json);
        } catch (Exception e) {
            // Don't fail the whole analysis if history saving fails
            log.warn("Could not persist analysis record for project {}: {}", projectId, e.getMessage());
        }
    }

    private AnalysisHistoryEntry entryFromNode(JsonNode node) {
        List<String> unsupported = new ArrayList<>();
        JsonNode unsupportedNode = node.path("unsupportedLanguages");
        if (unsupportedNode.isArray()) {
            unsupportedNode.forEach(n -> unsupported.add(n.asText()));
        }

        return AnalysisHistoryEntry.builder()
                .recordId(node.path("recordId").asText())
                .projectId(node.path("projectId").asLong())
                .projectName(node.path("projectName").asText())
                .analyzedAt(node.path("analyzedAt").asText())
                .filesAnalyzed(node.path("filesAnalyzed").asInt())
                .classesFound(node.path("classesFound").asInt())
                .unsupportedLanguages(unsupported)
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
