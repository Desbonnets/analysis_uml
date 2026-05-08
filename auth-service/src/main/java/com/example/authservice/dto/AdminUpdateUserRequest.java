package com.example.authservice.dto;

import jakarta.validation.constraints.Email;

public record AdminUpdateUserRequest(
        String name,
        @Email String email,
        String role,
        String plan
) {}
