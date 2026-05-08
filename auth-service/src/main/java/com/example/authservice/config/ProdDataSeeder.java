package com.example.authservice.config;

import com.example.authservice.entity.AppUser;
import com.example.authservice.entity.Role;
import com.example.authservice.repository.RoleRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Profile("docker")
@Order(1)
@RequiredArgsConstructor
public class ProdDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.admin.name:Admin}")
    private String adminName;

    @Value("${seed.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${seed.admin.password:Admin1234!}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        seedRoles();
        if (userRepository.existsByEmail(adminEmail)) return;
        Role adminRole = roleRepository.findByName("admin").orElseThrow();
        userRepository.save(AppUser.builder()
                .name(adminName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(adminRole)
                .plan("pro")
                .build());
    }

    private void seedRoles() {
        seedRole("admin", "Administrateur", "Accès complet à la plateforme",
                Set.of("MANAGE_USERS", "MANAGE_ROLES", "VIEW_ALL_PROJECTS", "MANAGE_ALL_PROJECTS", "VIEW_ANALYTICS"));
        seedRole("architect", "Architecte logiciel", "Gestion des projets et analyses avancées",
                Set.of("CREATE_PROJECT", "VIEW_ALL_PROJECTS", "MANAGE_OWN_PROJECTS", "VIEW_ANALYTICS"));
        seedRole("developer", "Développeur", "Accès aux projets et diagrammes",
                Set.of("CREATE_PROJECT", "MANAGE_OWN_PROJECTS", "VIEW_OWN_PROJECTS"));
    }

    private void seedRole(String name, String displayName, String description, Set<String> permissions) {
        if (roleRepository.existsByName(name)) return;
        roleRepository.save(Role.builder()
                .name(name)
                .displayName(displayName)
                .description(description)
                .permissions(permissions)
                .build());
    }
}
