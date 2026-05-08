package com.example.authservice.service;

import com.example.authservice.dto.*;
import com.example.authservice.entity.AppUser;
import com.example.authservice.entity.Role;
import com.example.authservice.repository.RoleRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserAdminDto> listUsers() {
        return userRepository.findAll().stream().map(this::toAdminDto).toList();
    }

    public UserAdminDto getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::toAdminDto)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public UserAdminDto createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }
        Role role = findRole(request.role());
        AppUser user = AppUser.builder()
                .name(request.name())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(role)
                .plan(request.plan() != null ? request.plan() : "free")
                .build();
        return toAdminDto(userRepository.save(user));
    }

    @Transactional
    public UserAdminDto updateUser(Long id, AdminUpdateUserRequest request) {
        AppUser user = findUser(id);
        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.email() != null && !request.email().isBlank() && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(request.email());
        }
        if (request.role() != null && !request.role().isBlank()) {
            user.setRole(findRole(request.role()));
        }
        if (request.plan() != null && !request.plan().isBlank()) {
            user.setPlan(request.plan());
        }
        return toAdminDto(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }

    @Transactional
    public UserAdminDto updateUserRole(Long id, String roleName) {
        AppUser user = findUser(id);
        user.setRole(findRole(roleName));
        return toAdminDto(userRepository.save(user));
    }

    public AuthResponse.UserDto getProfile(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return toProfileDto(user);
    }

    @Transactional
    public AuthResponse.UserDto updateProfile(String email, UpdateProfileRequest request) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.email() != null && !request.email().isBlank() && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new IllegalArgumentException("Email already in use");
            }
            user.setEmail(request.email());
        }
        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            if (request.currentPassword() == null
                    || !passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Mot de passe actuel incorrect");
            }
            user.setPassword(passwordEncoder.encode(request.newPassword()));
        }

        return toProfileDto(userRepository.save(user));
    }

    private AppUser findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Role findRole(String name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + name));
    }

    private UserAdminDto toAdminDto(AppUser u) {
        return new UserAdminDto(u.getId(), u.getName(), u.getEmail(),
                toRoleDto(u.getRole()), u.getPlan(), u.getCreatedAt());
    }

    private AuthResponse.UserDto toProfileDto(AppUser u) {
        return new AuthResponse.UserDto(u.getId(), u.getName(), u.getEmail(),
                u.getRole().getName(), u.getPlan());
    }

    private RoleDto toRoleDto(Role r) {
        return new RoleDto(r.getId(), r.getName(), r.getDisplayName(), r.getDescription(), r.getPermissions());
    }
}
