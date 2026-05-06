package com.example.authservice.dto;

public record AuthResponse(
        String token,
        UserDto user
) {
    public record UserDto(
            Long id,
            String name,
            String email,
            String role,
            String plan
    ) {}
}
