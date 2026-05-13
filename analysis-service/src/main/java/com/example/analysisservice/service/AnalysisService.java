package com.example.analysisservice.service;

import com.example.analysisservice.dto.AnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private static final long MAX_SIZE_BYTES = 50L * 1024 * 1024; // 50 MB
    private static final String ZIP_CONTENT_TYPE = "application/zip";
    private static final String ZIP_CONTENT_TYPE_ALT = "application/x-zip-compressed";

    private final StorageService storageService;

    public AnalysisResponse upload(Long projectId, MultipartFile file) {
        validateFile(file);

        String storageKey = storageService.upload(projectId, file);
        log.info("Project {} — source uploaded to {}", projectId, storageKey);

        return AnalysisResponse.builder()
                .projectId(projectId)
                .storageKey(storageKey)
                .status("uploaded")
                .message("Fichier source uploadé. L'analyse démarrera prochainement.")
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucun fichier fourni");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Fichier trop volumineux (max 50 Mo)");
        }
        String contentType = file.getContentType();
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "";
        boolean isZip = ZIP_CONTENT_TYPE.equals(contentType)
                || ZIP_CONTENT_TYPE_ALT.equals(contentType)
                || name.toLowerCase().endsWith(".zip");
        if (!isZip) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le fichier doit être une archive ZIP");
        }
    }
}
