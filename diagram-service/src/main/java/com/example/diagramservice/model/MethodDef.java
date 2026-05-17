package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MethodDef {
    private String name;
    private String returnType;
    private String visibility;
    private List<String> parameterTypes = new ArrayList<>();
    private boolean isStatic;
    private boolean isAbstract;
}
