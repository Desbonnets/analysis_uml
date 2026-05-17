package com.example.diagramservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiagramNode {
    private String id;
    private String name;
    private String qualifiedName;
    private String type;
    private String packageName;
    private List<String> fields;
    private List<String> methods;
}
