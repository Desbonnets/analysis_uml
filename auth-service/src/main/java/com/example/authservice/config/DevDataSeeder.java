package com.example.authservice.config;

import com.example.authservice.entity.AppUser;
import com.example.authservice.entity.Role;
import com.example.authservice.repository.RoleRepository;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seedRoles();
        seedUsers();
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

    private void seedUsers() {
        // Groupe 1 — projet Alpha
        seedUser("Admin Dev",    "admin@dev.local",  "Admin1234!@#",  "admin",     "pro");
        seedUser("Alice Dev",    "alice@dev.local",  "Alice1234!@#",  "architect", "pro");
        seedUser("Bob Dev",      "bob@dev.local",    "Bob@Dev1234!",  "developer", "free");
        // Groupe 2 — projet Beta
        seedUser("Carol Dev",    "carol@dev.local",  "Carol1234!@#",  "admin",     "pro");
        seedUser("Dave Dev",     "dave@dev.local",   "Dave1234!@#",   "architect", "pro");
        seedUser("Eve Dev",      "eve@dev.local",    "Eve@Dev1234!",  "developer", "free");
    }

    private void seedUser(String name, String email, String rawPassword, String roleName, String plan) {
        if (userRepository.existsByEmail(email)) return;
        Role role = roleRepository.findByName(roleName).orElseThrow();
        userRepository.save(AppUser.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .plan(plan)
                .build());
    }
}
