package com.example.analysisservice.controller;

import com.example.analysisservice.dto.AnalysisHistoryEntry;
import com.example.analysisservice.dto.AnalysisResponse;
import com.example.analysisservice.dto.IngestRequest;
import com.example.analysisservice.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    /**
     * POST /analysis/{projectId}
     * Upload a ZIP, analyse it, persist the result in MinIO history.
     *
     * @param projectName Optional project name used in the record filename.
     *                    Falls back to "projet-{projectId}" when absent.
     */
    @PostMapping(value = "/{projectId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> upload(
            @PathVariable Long projectId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "projectName", required = false, defaultValue = "") String projectName,
            @AuthenticationPrincipal UserDetails userDetails) {

        String name = projectName.isBlank() ? "projet-" + projectId : projectName;
        AnalysisResponse response = analysisService.upload(projectId, name, file);
        return ResponseEntity.accepted().body(response);
    }

    /**
     * POST /analysis/{projectId}/ingest
     * Accept pre-computed analysis results (no ZIP upload).
     * Used by CI pipelines (e.g. SonarQube) that run analysis locally.
     */
    @PostMapping(value = "/{projectId}/ingest", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AnalysisResponse> ingest(
            @PathVariable Long projectId,
            @RequestBody IngestRequest request,
            @RequestParam(value = "projectName", required = false, defaultValue = "") String projectName,
            @AuthenticationPrincipal UserDetails userDetails) {

        String name = projectName.isBlank() ? null : projectName;
        AnalysisResponse response = analysisService.ingest(projectId, name, request);
        return ResponseEntity.accepted().body(response);
    }

    /**
     * GET /analysis/{projectId}/history
     * Returns a lightweight list of past analyses, newest first.
     */
    @GetMapping("/{projectId}/history")
    public ResponseEntity<List<AnalysisHistoryEntry>> listHistory(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return ResponseEntity.ok(analysisService.listHistory(projectId));
    }

    /**
     * GET /analysis/{projectId}/history/{recordId}
     * Returns the full analysis record (including codeUnits) as stored in MinIO.
     *
     * @param recordId  Timestamp ID in the form yyyyMMdd-HHmmss (e.g. 20260517-143022).
     */
    @GetMapping(value = "/{projectId}/history/{recordId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<byte[]> getHistoryRecord(
            @PathVariable Long projectId,
            @PathVariable String recordId,
            @AuthenticationPrincipal UserDetails userDetails) {

        return analysisService.getHistoryRecordBytes(projectId, recordId)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(bytes))
                .orElse(ResponseEntity.notFound().build());
    }
}
