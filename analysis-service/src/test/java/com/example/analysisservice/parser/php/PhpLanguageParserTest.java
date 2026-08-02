package com.example.analysisservice.parser.php;

import com.example.analysisservice.model.ClassDef;
import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.MethodDef;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PhpLanguageParserTest {

    private final PhpLanguageParser parser = new PhpLanguageParser();

    private ClassDef parseClass(String source) throws Exception {
        List<CodeUnit> units = parser.parse(Map.of("Sample.php", source.getBytes(StandardCharsets.UTF_8)));
        return units.get(0).getClasses().get(0);
    }

    private MethodDef method(ClassDef c, String name) {
        return c.getMethods().stream().filter(m -> m.getName().equals(name)).findFirst().orElseThrow();
    }

    @Test
    void flagsTestNamedMethodInTestCaseSubclass() throws Exception {
        String source = """
                <?php
                use PHPUnit\\Framework\\TestCase;

                class OrderServiceTest extends TestCase
                {
                    public function testCreatesOrder()
                    {
                    }

                    private function helperMethod()
                    {
                    }
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "testCreatesOrder").isTest()).isTrue();
        assertThat(method(c, "helperMethod").isTest()).isFalse();
    }

    @Test
    void ignoresTestNamedMethodOutsideTestCaseSubclass() throws Exception {
        String source = """
                <?php
                class OrderService
                {
                    public function testConnection()
                    {
                    }
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "testConnection").isTest()).isFalse();
    }

    @Test
    void flagsDocblockTestTagOnNonConventionallyNamedMethod() throws Exception {
        String source = """
                <?php
                use PHPUnit\\Framework\\TestCase;

                class OrderServiceTest extends TestCase
                {
                    /**
                     * @test
                     */
                    public function itCreatesAnOrder()
                    {
                    }
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "itCreatesAnOrder").isTest()).isTrue();
    }

    @Test
    void extractsStoryIdFromGroupDocblock() throws Exception {
        String source = """
                <?php
                use PHPUnit\\Framework\\TestCase;

                class OrderServiceTest extends TestCase
                {
                    /**
                     * @group US-67
                     */
                    public function testCreatesOrder()
                    {
                    }
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "testCreatesOrder").getStoryId()).isEqualTo("US-67");
    }

    @Test
    void nonTestMethodHasNoStoryId() throws Exception {
        String source = """
                <?php
                use PHPUnit\\Framework\\TestCase;

                class OrderServiceTest extends TestCase
                {
                    public function testCreatesOrder()
                    {
                    }

                    private function helperMethod()
                    {
                    }
                }
                """;

        ClassDef c = parseClass(source);

        assertThat(method(c, "helperMethod").getStoryId()).isNull();
    }
}
