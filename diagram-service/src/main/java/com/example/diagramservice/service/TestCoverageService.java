package com.example.diagramservice.service;

import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.dto.MatchedTestDto;
import com.example.diagramservice.dto.RequirementCoverageDto;
import com.example.diagramservice.dto.TestCoverageReportDto;
import com.example.diagramservice.model.AnalysisHistoryEntry;
import com.example.diagramservice.model.AnalysisRecord;
import com.example.diagramservice.model.ClassDef;
import com.example.diagramservice.model.CodeUnit;
import com.example.diagramservice.model.MethodDef;
import com.example.diagramservice.requirements.RequirementsParser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Compares tests detected in the analyzed codebase (MethodDef.isTest / storyId, set by
 * JavaLanguageParser / PhpLanguageParser) against a user-supplied requirements backlog
 * (RequirementsParser), to surface which requirements have no test coverage.
 *
 * Two-level matching per test, ID mode takes priority, keyword mode is an explicitly-marked
 * fallback (see diagram-service/../docs/test-coverage-analysis.md):
 *  1. ID mode: a test's @Tag/@group value (digits only) matches a requirement's numeric ID
 *     -&gt; CONFIRMED.
 *  2. Keyword mode (only for tests with no ID match, or whose ID doesn't match any known
 *     requirement): overlap between the test method name's words and the requirement's
 *     title+description words, against a minimum-shared-keywords threshold -&gt; HEURISTIC on
 *     the best-scoring requirement. Below threshold, the test is linked to no requirement.
 *
 * Tests matched to neither an ID nor a keyword-heuristic requirement are reported separately as
 * "orphan" tests (present in the code, not linked to any requirement) rather than silently
 * dropped — useful to spot tests that likely need a `@Tag`/`@group` added, or a requirement
 * that's missing from the backlog altogether.
 *
 * v1 scope: proves a test exists and claims to cover a requirement, not that it tests the
 * right behavior — a traceability aid, not a quality guarantee.
 *
 * Matching thresholds (MIN_SHARED_KEYWORDS / MIN_SINGLE_KEYWORD_LENGTH) are a starting point,
 * not tuned against a real backlog yet — see spec doc, open point #2.
 */
@Service
@RequiredArgsConstructor
public class TestCoverageService {

    private static final int MIN_SHARED_KEYWORDS = 2;
    private static final int MIN_SINGLE_KEYWORD_LENGTH = 6;

    private static final Set<String> STOPWORDS = Set.of(
            "le", "la", "les", "un", "une", "des", "de", "du", "et", "en", "je", "veux", "pour",
            "que", "qui", "dans", "avec", "sur", "aux", "au", "est", "the", "and", "for", "with",
            "test", "tests", "should", "this", "that", "from", "into"
    );

    private final AnalysisClient analysisClient;
    private final RequirementsParser requirementsParser;

    public TestCoverageReportDto generate(Long projectId, String recordId, String requirementsSource, String authHeader) {
        if (recordId == null) {
            recordId = resolveLatestRecordId(projectId, authHeader);
        }

        AnalysisRecord record = analysisClient.getRecord(projectId, recordId, authHeader);
        Map<String, RequirementsParser.ParsedRequirement> requirements = requirementsParser.parse(requirementsSource);

        List<DetectedTest> tests = new ArrayList<>();
        for (CodeUnit cu : record.getCodeUnits()) {
            for (ClassDef c : cu.getClasses()) {
                for (MethodDef m : c.getMethods()) {
                    if (m.isTest()) {
                        tests.add(new DetectedTest(c.getName(), m.getName(), m.getStoryId()));
                    }
                }
            }
        }

        Map<String, List<MatchedTestDto>> matchesByRequirement = new LinkedHashMap<>();
        for (String id : requirements.keySet()) matchesByRequirement.put(id, new ArrayList<>());
        List<MatchedTestDto> orphanTests = new ArrayList<>();

        for (DetectedTest test : tests) {
            String storyDigits = digitsOnly(test.storyId());
            if (storyDigits != null && requirements.containsKey(storyDigits)) {
                matchesByRequirement.get(storyDigits).add(MatchedTestDto.builder()
                        .className(test.className())
                        .methodName(test.methodName())
                        .confidence("CONFIRMED")
                        .build());
                continue;
            }

            List<String> testKeywords = tokenize(test.methodName());
            String bestRequirementId = null;
            List<String> bestShared = List.of();
            for (Map.Entry<String, RequirementsParser.ParsedRequirement> entry : requirements.entrySet()) {
                RequirementsParser.ParsedRequirement req = entry.getValue();
                List<String> reqKeywords = tokenize(req.title() + " " + req.description());
                List<String> shared = testKeywords.stream().filter(reqKeywords::contains).distinct().toList();
                if (shared.size() > bestShared.size()) {
                    bestShared = shared;
                    bestRequirementId = entry.getKey();
                }
            }

            if (bestRequirementId != null && isHeuristicMatch(bestShared)) {
                matchesByRequirement.get(bestRequirementId).add(MatchedTestDto.builder()
                        .className(test.className())
                        .methodName(test.methodName())
                        .confidence("HEURISTIC")
                        .matchedKeywords(bestShared)
                        .build());
            } else {
                orphanTests.add(MatchedTestDto.builder()
                        .className(test.className())
                        .methodName(test.methodName())
                        .confidence("UNMATCHED")
                        .build());
            }
        }

        List<RequirementCoverageDto> coverage = new ArrayList<>();
        int coveredCount = 0;
        for (Map.Entry<String, RequirementsParser.ParsedRequirement> entry : requirements.entrySet()) {
            List<MatchedTestDto> matches = matchesByRequirement.get(entry.getKey());
            String status = matches.stream().anyMatch(t -> "CONFIRMED".equals(t.getConfidence())) ? "COVERED_CONFIRMED"
                    : matches.isEmpty() ? "UNCOVERED" : "COVERED_HEURISTIC";
            if (!"UNCOVERED".equals(status)) coveredCount++;

            coverage.add(RequirementCoverageDto.builder()
                    .requirementId(entry.getKey())
                    .title(entry.getValue().title())
                    .status(status)
                    .matchedTests(matches)
                    .build());
        }

        return TestCoverageReportDto.builder()
                .projectId(projectId)
                .recordId(recordId)
                .requirementCount(requirements.size())
                .coveredCount(coveredCount)
                .uncoveredCount(requirements.size() - coveredCount)
                .coverage(coverage)
                .orphanTestCount(orphanTests.size())
                .orphanTests(orphanTests)
                .build();
    }

    private boolean isHeuristicMatch(List<String> shared) {
        if (shared.size() >= MIN_SHARED_KEYWORDS) return true;
        return shared.size() == 1 && shared.get(0).length() >= MIN_SINGLE_KEYWORD_LENGTH;
    }

    private List<String> tokenize(String text) {
        if (text == null || text.isBlank()) return List.of();
        String spaced = text.replaceAll("([a-z0-9])([A-Z])", "$1 $2");
        return Arrays.stream(spaced.split("[^\\p{L}\\p{N}]+"))
                .map(String::toLowerCase)
                .filter(w -> w.length() >= 3)
                .filter(w -> !STOPWORDS.contains(w))
                .distinct()
                .toList();
    }

    private String digitsOnly(String s) {
        if (s == null) return null;
        String d = s.replaceAll("\\D", "");
        return d.isEmpty() ? null : d;
    }

    private String resolveLatestRecordId(Long projectId, String authHeader) {
        List<AnalysisHistoryEntry> history = analysisClient.getHistory(projectId, authHeader);
        if (history == null || history.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No analysis found for project " + projectId);
        }
        return history.get(0).getRecordId();
    }

    private record DetectedTest(String className, String methodName, String storyId) {
    }
}
