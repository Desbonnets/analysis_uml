package com.example.diagramservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrmRelation {
    private String relationType;  // MANY_TO_ONE, ONE_TO_MANY, MANY_TO_MANY, ONE_TO_ONE
    private String targetEntity;  // simple class name (e.g. "Category")
}
