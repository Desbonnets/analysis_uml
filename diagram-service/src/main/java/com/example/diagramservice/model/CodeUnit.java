package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CodeUnit {
    private String fileName;
    private String packageName;
    private String language;
    private List<String> imports = new ArrayList<>();
    private List<ClassDef> classes = new ArrayList<>();
}
