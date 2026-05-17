package com.example.analysisservice.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClassDef {
    private String name;
    private String qualifiedName;
    private ClassType type;
    private String visibility;
    private String superClass;
    @Builder.Default private List<String> interfaces = new java.util.ArrayList<>();
    @Builder.Default private List<MethodDef> methods = new java.util.ArrayList<>();
    @Builder.Default private List<FieldDef> fields = new java.util.ArrayList<>();
    @Builder.Default private List<String> dependencies = new java.util.ArrayList<>();
}
