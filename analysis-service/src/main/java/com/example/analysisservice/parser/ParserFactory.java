package com.example.analysisservice.parser;

import com.example.analysisservice.model.Language;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ParserFactory {

    private final Map<Language, LanguageParser> parsers;

    public ParserFactory(List<LanguageParser> parsers) {
        this.parsers = parsers.stream()
                .collect(Collectors.toMap(LanguageParser::getLanguage, p -> p));
    }

    public Optional<LanguageParser> getParser(Language language) {
        return Optional.ofNullable(parsers.get(language));
    }

    public Language detectLanguage(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0) return Language.UNKNOWN;
        return Language.fromExtension(filename.substring(dot + 1));
    }
}
