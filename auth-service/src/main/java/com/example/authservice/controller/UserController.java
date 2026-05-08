package com.example.authservice.controller;

import com.example.authservice.dto.AdminCreateUserRequest;
import com.example.authservice.dto.AdminUpdateUserRequest;
import com.example.authservice.dto.UserAdminDto;
import com.example.authservice.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserManagementService userManagementService;

    @GetMapping
    public ResponseEntity<List<UserAdminDto>> listUsers() {
        return ResponseEntity.ok(userManagementService.listUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAdminDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userManagementService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserAdminDto> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userManagementService.createUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAdminDto> updateUser(@PathVariable Long id,
                                                    @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(userManagementService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userManagementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserAdminDto> updateUserRole(@PathVariable Long id,
                                                        @RequestBody Map<String, String> body) {
        String roleName = body.get("role");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userManagementService.updateUserRole(id, roleName));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .findFirst()
                .orElse("Données invalides");
        return ResponseEntity.badRequest().body(Map.of("error", message));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
