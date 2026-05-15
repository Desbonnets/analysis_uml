package com.example.analysisservice.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CodeUnit {
    private String fileName;
    private String packageName;
    private Language language;
    @Builder.Default private List<String> imports = new java.util.ArrayList<>();
    @Builder.Default private List<ClassDef> classes = new java.util.ArrayList<>();
}
