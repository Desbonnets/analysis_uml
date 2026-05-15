package com.example.analysisservice.model;

public enum Language {
    JAVA, JAVASCRIPT, TYPESCRIPT, PYTHON, PHP, C, CPP, UNKNOWN;

    public static Language fromExtension(String ext) {
        return switch (ext.toLowerCase()) {
            case "java"             -> JAVA;
            case "js", "mjs", "cjs" -> JAVASCRIPT;
            case "ts", "tsx"        -> TYPESCRIPT;
            case "py"               -> PYTHON;
            case "php"              -> PHP;
            case "c", "h"           -> C;
            case "cpp", "cc", "cxx", "hpp" -> CPP;
            default                 -> UNKNOWN;
        };
    }
}
