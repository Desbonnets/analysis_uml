package com.example.analysisservice.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FieldDef {
    private String name;
    private String type;
    private String visibility;
    private boolean isStatic;
    private boolean isFinal;
}
