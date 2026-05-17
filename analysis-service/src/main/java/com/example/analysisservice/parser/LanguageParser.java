package com.example.analysisservice.parser;

import com.example.analysisservice.model.CodeUnit;
import com.example.analysisservice.model.Language;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface LanguageParser {
    Language getLanguage();
    List<CodeUnit> parse(Map<String, byte[]> files) throws IOException;
}
