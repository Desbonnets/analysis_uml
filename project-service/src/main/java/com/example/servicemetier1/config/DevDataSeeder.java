package com.example.servicemetier1.config;

import com.example.servicemetier1.entity.Project;
import com.example.servicemetier1.entity.ProjectMember;
import com.example.servicemetier1.repository.ProjectMemberRepository;
import com.example.servicemetier1.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

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
        // Projet Alpha — groupe 1 : admin@dev.local (owner), alice@dev.local, bob@dev.local
        Project alpha = projectRepository.save(Project.builder()
                .name("Projet Alpha")
                .description("Premier projet de démonstration.")
                .language("Spring Boot")
                .status("new")
                .ownerEmail("admin@dev.local")
                .ownerName("Admin Dev")
                .build());
        addMember(alpha, "admin@dev.local", "Admin Dev",  "owner");
        addMember(alpha, "alice@dev.local", "Alice Dev",  "member");
        addMember(alpha, "bob@dev.local",   "Bob Dev",    "member");

        // Projet Beta — groupe 2 : carol@dev.local (owner), dave@dev.local, eve@dev.local
        Project beta = projectRepository.save(Project.builder()
                .name("Projet Beta")
                .description("Deuxième projet de démonstration.")
                .language("Spring Boot")
                .status("new")
                .ownerEmail("carol@dev.local")
                .ownerName("Carol Dev")
                .build());
        addMember(beta, "carol@dev.local", "Carol Dev", "owner");
        addMember(beta, "dave@dev.local",  "Dave Dev",  "member");
        addMember(beta, "eve@dev.local",   "Eve Dev",   "member");
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
