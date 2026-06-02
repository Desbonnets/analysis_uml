package com.example.analysisservice.model;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrmRelation {
    private String relationType;  // MANY_TO_ONE, ONE_TO_MANY, MANY_TO_MANY, ONE_TO_ONE
    private String targetEntity;  // simple class name (e.g. "Category")
}
