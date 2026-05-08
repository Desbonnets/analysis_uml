package com.example.authservice.service;

import com.example.authservice.dto.RoleDto;
import com.example.authservice.entity.Role;
import com.example.authservice.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public List<RoleDto> listRoles() {
        return roleRepository.findAll().stream().map(this::toDto).toList();
    }

    public RoleDto getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("Role not found"));
    }

    private RoleDto toDto(Role r) {
        return new RoleDto(r.getId(), r.getName(), r.getDisplayName(), r.getDescription(), r.getPermissions());
    }
}
