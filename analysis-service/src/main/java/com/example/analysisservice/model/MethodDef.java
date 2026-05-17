package com.example.analysisservice.model;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MethodDef {
    private String name;
    private String returnType;
    private String visibility;
    private List<String> parameterTypes;
    private boolean isStatic;
    private boolean isAbstract;
}
