package com.example.diagramservice.client;

import com.example.diagramservice.model.AnalysisHistoryEntry;
import com.example.diagramservice.model.AnalysisRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class AnalysisClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public List<AnalysisHistoryEntry> getHistory(Long projectId, String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        try {
            ResponseEntity<List<AnalysisHistoryEntry>> response = restTemplate.exchange(
                    "http://analysis-service/analysis/{projectId}/history",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    new ParameterizedTypeReference<List<AnalysisHistoryEntry>>() {},
                    projectId
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(e.getStatusCode(), "analysis-service: " + e.getMessage());
        } catch (Exception e) {
            log.error("Could not reach analysis-service for project {} history: {}", projectId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "analysis-service inaccessible: " + e.getMessage());
        }
    }

    public AnalysisRecord getRecord(Long projectId, String recordId, String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);
        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    "http://analysis-service/analysis/{projectId}/history/{recordId}",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class,
                    projectId, recordId
            );
            return objectMapper.readValue(response.getBody(), AnalysisRecord.class);
        } catch (HttpClientErrorException.NotFound e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Analyse " + recordId + " introuvable pour le projet " + projectId);
        } catch (HttpClientErrorException e) {
            throw new ResponseStatusException(e.getStatusCode(), "analysis-service: " + e.getMessage());
        } catch (Exception e) {
            log.error("Could not retrieve record {} for project {}: {}", recordId, projectId, e.getMessage());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "analysis-service inaccessible: " + e.getMessage());
        }
    }
}
