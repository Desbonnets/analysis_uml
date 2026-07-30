package com.example.diagramservice.service;

import com.example.diagramservice.dto.RequirementCoverageDto;
import com.example.diagramservice.dto.TestCoverageReportDto;
import com.example.diagramservice.client.AnalysisClient;
import com.example.diagramservice.model.AnalysisRecord;
import com.example.diagramservice.model.ClassDef;
import com.example.diagramservice.model.CodeUnit;
import com.example.diagramservice.model.MethodDef;
import com.example.diagramservice.requirements.RequirementsParser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TestCoverageServiceTest {

    @Mock
    private AnalysisClient analysisClient;

    private TestCoverageService service() {
        return new TestCoverageService(analysisClient, new RequirementsParser());
    }

    private MethodDef testMethod(String name, String storyId) {
        MethodDef m = new MethodDef();
        m.setName(name);
        m.setTest(true);
        m.setStoryId(storyId);
        m.setParameterTypes(List.of());
        return m;
    }

    private MethodDef nonTestMethod(String name) {
        MethodDef m = new MethodDef();
        m.setName(name);
        m.setTest(false);
        m.setParameterTypes(List.of());
        return m;
    }

    private ClassDef classWithMethods(String name, MethodDef... methods) {
        ClassDef c = new ClassDef();
        c.setName(name);
        c.setMethods(List.of(methods));
        return c;
    }

    private AnalysisRecord recordWith(ClassDef... classes) {
        CodeUnit cu = new CodeUnit();
        cu.setClasses(List.of(classes));
        AnalysisRecord record = new AnalysisRecord();
        record.setRecordId("r1");
        record.setCodeUnits(List.of(cu));
        return record;
    }

    @Test
    void confirmedMatchByStoryTag() {
        ClassDef c = classWithMethods("OrderServiceTest", testMethod("createsOrder", "US-67"));
        when(analysisClient.getRecord(eq(1L), eq("r1"), eq("Bearer t"))).thenReturn(recordWith(c));

        TestCoverageReportDto report = service().generate(1L, "r1",
                "67. **Choisir un contrôle** — En tant qu'utilisateur, je veux...", "Bearer t");

        RequirementCoverageDto cov = report.getCoverage().get(0);
        assertThat(cov.getStatus()).isEqualTo("COVERED_CONFIRMED");
        assertThat(cov.getMatchedTests()).extracting(t -> t.getConfidence()).containsExactly("CONFIRMED");
        assertThat(report.getCoveredCount()).isEqualTo(1);
        assertThat(report.getUncoveredCount()).isZero();
    }

    @Test
    void heuristicMatchByKeywordOverlap() {
        ClassDef c = classWithMethods("AuthServiceTest", testMethod("expiredTokenIsRejected", null));
        when(analysisClient.getRecord(eq(1L), eq("r1"), eq("Bearer t"))).thenReturn(recordWith(c));

        TestCoverageReportDto report = service().generate(1L, "r1",
                "10. Expired token rejection — reject an expired authentication token", "Bearer t");

        RequirementCoverageDto cov = report.getCoverage().get(0);
        assertThat(cov.getStatus()).isEqualTo("COVERED_HEURISTIC");
        assertThat(cov.getMatchedTests()).hasSize(1);
        assertThat(cov.getMatchedTests().get(0).getConfidence()).isEqualTo("HEURISTIC");
        assertThat(cov.getMatchedTests().get(0).getMatchedKeywords()).contains("expired", "token");
    }

    @Test
    void requirementWithNoMatchingTestIsUncovered() {
        ClassDef c = classWithMethods("OrderServiceTest", testMethod("createsOrder", "US-1"));
        when(analysisClient.getRecord(eq(1L), eq("r1"), eq("Bearer t"))).thenReturn(recordWith(c));

        TestCoverageReportDto report = service().generate(1L, "r1",
                "99. Suppression de compte — l'utilisateur peut supprimer son compte", "Bearer t");

        RequirementCoverageDto cov = report.getCoverage().get(0);
        assertThat(cov.getStatus()).isEqualTo("UNCOVERED");
        assertThat(cov.getMatchedTests()).isEmpty();
        assertThat(report.getUncoveredCount()).isEqualTo(1);
    }

    @Test
    void nonTestMethodsAreIgnoredEvenIfNameMatchesKeywords() {
        ClassDef c = classWithMethods("OrderService", nonTestMethod("expiredTokenIsRejected"));
        when(analysisClient.getRecord(eq(1L), eq("r1"), eq("Bearer t"))).thenReturn(recordWith(c));

        TestCoverageReportDto report = service().generate(1L, "r1",
                "10. Expired token rejection — reject an expired authentication token", "Bearer t");

        assertThat(report.getCoverage().get(0).getStatus()).isEqualTo("UNCOVERED");
    }
}
