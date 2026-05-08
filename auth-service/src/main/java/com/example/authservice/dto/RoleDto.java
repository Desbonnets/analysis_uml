package com.example.authservice.dto;

import java.util.Set;

public record RoleDto(
        Long id,
        String name,
        String displayName,
        String description,
        Set<String> permissions
) {}
