package com.example.authservice.dto;

import jakarta.validation.constraints.Email;

public record UpdateProfileRequest(
        String name,
        @Email String email,
        String currentPassword,
        String newPassword
) {}
