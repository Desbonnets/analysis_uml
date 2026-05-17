package com.example.analysisservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.LinkedHashMap;
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

    public Map<String, byte[]> extractSourceFiles(InputStream zipStream) throws IOException {
        Map<String, byte[]> result = new LinkedHashMap<>();
        try (ZipInputStream zis = new ZipInputStream(zipStream)) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (!entry.isDirectory() && isSupported(name)) {
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

    private boolean isSupported(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return false;
        // skip hidden/build files (node_modules, .git, target/, etc.)
        if (filename.contains("node_modules/") || filename.contains("/.git/")
                || filename.contains("/target/") || filename.contains("/__pycache__/")) {
            return false;
        }
        return SUPPORTED.contains(filename.substring(dot + 1).toLowerCase());
    }
}
