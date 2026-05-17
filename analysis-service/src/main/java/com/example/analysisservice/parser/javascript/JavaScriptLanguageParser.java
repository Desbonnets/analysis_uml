package com.example.analysisservice.parser.javascript;

import com.example.analysisservice.model.Language;
import org.springframework.stereotype.Component;

@Component
public class JavaScriptLanguageParser extends JsRegexParser {

    @Override
    public Language getLanguage() {
        return Language.JAVASCRIPT;
    }
}
