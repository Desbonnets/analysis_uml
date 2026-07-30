package com.example.analysisservice.parser.java;

import com.example.analysisservice.model.ClassDef;
import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.MethodDef;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class JavaLanguageParserTest {

    private final JavaLanguageParser parser = new JavaLanguageParser();

    private ClassDef parseClass(String source) throws Exception {
        List<CodeUnit> units = parser.parse(Map.of("Sample.java", source.getBytes(StandardCharsets.UTF_8)));
        return units.get(0).getClasses().get(0);
    }

    private MethodDef method(ClassDef c, String name) {
        return c.getMethods().stream().filter(m -> m.getName().equals(name)).findFirst().orElseThrow();
    }

    @Test
    void flagsJUnit5TestAnnotation() throws Exception {
        String source = """
                import org.junit.jupiter.api.Test;

                class OrderServiceTest {
                    @Test
                    void createsOrder() {}

                    void helperMethod() {}
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "createsOrder").isTest()).isTrue();
        assertThat(method(c, "helperMethod").isTest()).isFalse();
    }

    @Test
    void flagsFullyQualifiedJUnit4TestAnnotation() throws Exception {
        String source = """
                class LegacyTest {
                    @org.junit.Test
                    public void oldStyleTest() {}
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "oldStyleTest").isTest()).isTrue();
    }

    @Test
    void extractsStoryIdFromTagAnnotation() throws Exception {
        String source = """
                import org.junit.jupiter.api.Tag;
                import org.junit.jupiter.api.Test;

                class OrderServiceTest {
                    @Test
                    @Tag("US-67")
                    void createsOrder() {}
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "createsOrder").getStoryId()).isEqualTo("US-67");
    }

    @Test
    void extractsStoryIdFromNamedTagValue() throws Exception {
        String source = """
                import org.junit.jupiter.api.Tag;
                import org.junit.jupiter.api.Test;

                class OrderServiceTest {
                    @Test
                    @Tag(value = "US-68")
                    void createsOrder() {}
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "createsOrder").getStoryId()).isEqualTo("US-68");
    }

    @Test
    void nonTestMethodHasNoStoryId() throws Exception {
        String source = """
                class OrderService {
                    void createOrder() {}
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "createOrder").isTest()).isFalse();
        assertThat(method(c, "createOrder").getStoryId()).isNull();
    }
}
