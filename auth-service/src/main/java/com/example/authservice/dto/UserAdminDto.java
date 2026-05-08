package com.example.authservice.dto;

import java.time.LocalDateTime;

public record UserAdminDto(
        Long id,
        String name,
        String email,
        RoleDto role,
        String plan,
        LocalDateTime createdAt
) {}
