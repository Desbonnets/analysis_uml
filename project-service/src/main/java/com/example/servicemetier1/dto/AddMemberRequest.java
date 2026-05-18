package com.example.servicemetier1.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(
        @NotBlank @Email String userEmail,
        String userName
) {}
