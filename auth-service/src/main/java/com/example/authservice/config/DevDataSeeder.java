package com.example.authservice.config;

import com.example.authservice.entity.AppUser;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("!docker")
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        seed("Admin Dev",  "admin@dev.local", "Admin1234!@#", "admin",     "pro");
        seed("Alice Dev",  "alice@dev.local", "Alice1234!@#", "developer", "pro");
        seed("Bob Dev",    "bob@dev.local",   "Bob@Dev1234!", "developer", "free");
    }

    private void seed(String name, String email, String rawPassword, String role, String plan) {
        if (userRepository.existsByEmail(email)) return;
        userRepository.save(AppUser.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(role)
                .plan(plan)
                .build());
    }
}
