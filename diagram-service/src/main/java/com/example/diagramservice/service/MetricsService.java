package com.example.diagramservice.service;

import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.dto.MetricPoint;
import com.example.diagramservice.dto.MetricsDto;
import com.example.diagramservice.model.AnalysisHistoryEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final AnalysisClient analysisClient;

    public MetricsDto getMetrics(Long projectId, String authHeader) {
        List<AnalysisHistoryEntry> history = analysisClient.getHistory(projectId, authHeader);

        if (history == null) {
            return MetricsDto.builder().projectId(projectId).dataPoints(List.of()).build();
        }

        List<MetricPoint> dataPoints = history.stream()
                .sorted(Comparator.comparing(AnalysisHistoryEntry::getAnalyzedAt))
                .map(e -> MetricPoint.builder()
                        .recordId(e.getRecordId())
                        .analyzedAt(e.getAnalyzedAt())
                        .projectName(e.getProjectName())
                        .filesAnalyzed(e.getFilesAnalyzed())
                        .classesFound(e.getClassesFound())
                        .build())
                .collect(Collectors.toList());

        return MetricsDto.builder()
                .projectId(projectId)
                .dataPoints(dataPoints)
                .build();
    }
}
