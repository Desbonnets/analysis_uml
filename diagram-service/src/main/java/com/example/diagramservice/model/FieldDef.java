package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FieldDef {
    private String name;
    private String type;
    private String visibility;
    private boolean isStatic;
    private boolean isFinal;
}
