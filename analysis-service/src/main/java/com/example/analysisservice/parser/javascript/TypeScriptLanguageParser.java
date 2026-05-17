package com.example.analysisservice.parser.javascript;

import com.example.analysisservice.model.Language;
import org.springframework.stereotype.Component;

@Component
public class TypeScriptLanguageParser extends JsRegexParser {

    @Override
    public Language getLanguage() {
        return Language.TYPESCRIPT;
    }

    @Override
    protected boolean supportsTypeScriptConstructs() {
        return true;
    }
}
