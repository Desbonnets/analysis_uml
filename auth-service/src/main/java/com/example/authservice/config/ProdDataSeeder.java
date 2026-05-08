package com.example.authservice.config;

import com.example.authservice.entity.AppUser;
import com.example.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Profile("docker")
@RequiredArgsConstructor
public class ProdDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.admin.name:Admin}")
    private String adminName;

    @Value("${seed.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${seed.admin.password:Admin1234!}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) return;
        userRepository.save(AppUser.builder()
                .name(adminName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role("admin")
                .plan("pro")
                .build());
    }
}
