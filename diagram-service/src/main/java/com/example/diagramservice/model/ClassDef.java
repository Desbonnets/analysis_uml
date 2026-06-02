package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassDef {
    private String name;
    private String qualifiedName;
    private String type;
    private String visibility;
    private String superClass;
    private List<String> interfaces = new ArrayList<>();
    private List<MethodDef> methods = new ArrayList<>();
    private List<FieldDef> fields = new ArrayList<>();
    private List<String> dependencies = new ArrayList<>();
    private List<OrmRelation> ormRelations = new ArrayList<>();
}
