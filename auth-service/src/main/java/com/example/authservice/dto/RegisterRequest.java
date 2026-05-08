package com.example.authservice.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z0-9]).{12,}$",
            message = "Le mot de passe doit contenir au minimum 12 caractères avec au moins une majuscule, une minuscule, un chiffre et un caractère spécial"
        )
        String password,
        String role
) {}
