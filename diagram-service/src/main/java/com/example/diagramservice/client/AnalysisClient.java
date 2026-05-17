package com.example.diagramservice.client;

import com.example.diagramservice.model.AnalysisHistoryEntry;
import com.example.diagramservice.model.AnalysisRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AnalysisClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public List<AnalysisHistoryEntry> getHistory(Long projectId, String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);

        ResponseEntity<List<AnalysisHistoryEntry>> response = restTemplate.exchange(
                "http://analysis-service/analysis/{projectId}/history",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                new ParameterizedTypeReference<List<AnalysisHistoryEntry>>() {},
                projectId
        );
        return response.getBody();
    }

    public AnalysisRecord getRecord(Long projectId, String recordId, String authHeader) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);

        ResponseEntity<String> response = restTemplate.exchange(
                "http://analysis-service/analysis/{projectId}/history/{recordId}",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                String.class,
                projectId, recordId
        );

        try {
            return objectMapper.readValue(response.getBody(), AnalysisRecord.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse analysis record: " + e.getMessage(), e);
        }
    }
}
