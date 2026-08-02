package com.example.servicemetier1.config;

import com.example.servicemetier1.entity.Project;
import com.example.servicemetier1.entity.ProjectMember;
import com.example.servicemetier1.repository.ProjectMemberRepository;
import com.example.servicemetier1.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (projectRepository.count() > 0) return;
        seed();
    }

    private void seed() {
        // Groupe 1 : admin@dev.local, alice@dev.local, bob@dev.local — 2 projets, propriétaires différents
        Project alpha = projectRepository.save(Project.builder()
                .name("Projet Alpha")
                .description("Premier projet de démonstration.")
                .languages(List.of("Spring Boot", "Node.js"))
                .status("new")
                .ownerEmail("admin@dev.local")
                .ownerName("Admin Dev")
                .build());
        addMember(alpha, "admin@dev.local", "Admin Dev",  "owner");
        addMember(alpha, "alice@dev.local", "Alice Dev",  "member");
        addMember(alpha, "bob@dev.local",   "Bob Dev",    "member");

        Project alphaLegacy = projectRepository.save(Project.builder()
                .name("Projet Alpha Legacy")
                .description("Ancienne application du groupe Alpha, encore en maintenance.")
                .languages(List.of("Symfony"))
                .status("new")
                .ownerEmail("alice@dev.local")
                .ownerName("Alice Dev")
                .build());
        addMember(alphaLegacy, "alice@dev.local", "Alice Dev", "owner");
        addMember(alphaLegacy, "admin@dev.local", "Admin Dev", "member");
        addMember(alphaLegacy, "bob@dev.local",   "Bob Dev",   "member");

        // Groupe 2 : carol@dev.local, dave@dev.local, eve@dev.local — 2 projets, propriétaires différents
        Project beta = projectRepository.save(Project.builder()
                .name("Projet Beta")
                .description("Deuxième projet de démonstration.")
                .languages(List.of("Symfony"))
                .status("new")
                .ownerEmail("carol@dev.local")
                .ownerName("Carol Dev")
                .build());
        addMember(beta, "carol@dev.local", "Carol Dev", "owner");
        addMember(beta, "dave@dev.local",  "Dave Dev",  "member");
        addMember(beta, "eve@dev.local",   "Eve Dev",   "member");

        Project betaServices = projectRepository.save(Project.builder()
                .name("Projet Beta Services")
                .description("API backend du groupe Beta.")
                .languages(List.of("Spring Boot"))
                .status("new")
                .ownerEmail("dave@dev.local")
                .ownerName("Dave Dev")
                .build());
        addMember(betaServices, "dave@dev.local",  "Dave Dev",  "owner");
        addMember(betaServices, "carol@dev.local", "Carol Dev", "member");
        addMember(betaServices, "eve@dev.local",   "Eve Dev",   "member");
    }

    private void addMember(Project project, String email, String name, String role) {
        memberRepository.save(ProjectMember.builder()
                .project(project)
                .userEmail(email)
                .userName(name)
                .role(role)
                .build());
    }
}
