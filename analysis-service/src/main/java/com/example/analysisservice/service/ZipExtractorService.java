package com.example.analysisservice.service;

import com.example.analysisservice.model.AnalysisConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Slf4j
@Service
public class ZipExtractorService {

    private static final int MAX_ENTRY_BYTES = 10 * 1024 * 1024; // 10 MB per file
    private static final Set<String> SUPPORTED = Set.of(
            "java", "js", "mjs", "ts", "tsx", "py", "php", "c", "h", "cpp", "cc", "cxx", "hpp"
    );
    private static final Set<String> CONFIG_FILENAMES = Set.of(
            "analysis.yml", "analysis.yaml", "analysis.json"
    );

    private final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
    private final ObjectMapper jsonMapper = new ObjectMapper();

    public Map<String, byte[]> extractSourceFiles(byte[] zipBytes) throws IOException {
        List<String> customExclusions = readCustomExclusions(zipBytes);
        if (!customExclusions.isEmpty()) {
            log.info("analysis config — {} custom exclusion(s): {}", customExclusions.size(), customExclusions);
        }

        Map<String, byte[]> result = new LinkedHashMap<>();
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (!entry.isDirectory() && isSupported(name, customExclusions)) {
                    byte[] content = readSafely(zis, name);
                    if (content != null) {
                        result.put(name, content);
                    }
                }
                zis.closeEntry();
            }
        }
        log.info("Extracted {} source files from ZIP", result.size());
        return result;
    }

    // First pass: find the config file and parse exclusion patterns.
    private List<String> readCustomExclusions(byte[] zipBytes) {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                String basename = name.contains("/") ? name.substring(name.lastIndexOf('/') + 1) : name;
                if (!entry.isDirectory() && CONFIG_FILENAMES.contains(basename)) {
                    byte[] raw = readSafely(zis, name);
                    if (raw != null) {
                        return parseConfig(basename, raw);
                    }
                }
                zis.closeEntry();
            }
        } catch (IOException e) {
            log.warn("Could not scan ZIP for analysis config: {}", e.getMessage());
        }
        return List.of();
    }

    private List<String> parseConfig(String filename, byte[] raw) {
        try {
            String content = new String(raw, StandardCharsets.UTF_8);
            ObjectMapper mapper = filename.endsWith(".json") ? jsonMapper : yamlMapper;
            AnalysisConfig config = mapper.readValue(content, AnalysisConfig.class);
            List<String> exclusions = config.getExclude();
            return exclusions == null ? List.of() : exclusions;
        } catch (Exception e) {
            log.warn("Could not parse {}: {}", filename, e.getMessage());
            return List.of();
        }
    }

    private byte[] readSafely(ZipInputStream zis, String name) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int read;
        int total = 0;
        while ((read = zis.read(buf)) != -1) {
            total += read;
            if (total > MAX_ENTRY_BYTES) {
                log.warn("Skipping {} — exceeds {} MB", name, MAX_ENTRY_BYTES / (1024 * 1024));
                return null;
            }
            baos.write(buf, 0, read);
        }
        return baos.toByteArray();
    }

    private boolean isSupported(String filename, List<String> customExclusions) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return false;
        // built-in path exclusions
        if (filename.contains("node_modules/") || filename.contains("/.git/")
                || filename.contains("/target/") || filename.contains("/__pycache__/")) {
            return false;
        }
        // user-defined exclusions from analysis.yml
        for (String pattern : customExclusions) {
            if (filename.contains(pattern)) return false;
        }
        return SUPPORTED.contains(filename.substring(dot + 1).toLowerCase());
    }
}
