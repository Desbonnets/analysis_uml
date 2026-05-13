package com.example.servicemetier1.config;

import com.example.servicemetier1.entity.Project;
import com.example.servicemetier1.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DevDataSeeder implements ApplicationRunner {

    private final ProjectRepository projectRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (projectRepository.count() > 0) return;
        seed();
    }

    private void seed() {
        save("EcommerceApp",
             "Plateforme e-commerce microservices avec gestion de catalogue, panier et paiement.",
             "Spring Boot", "analyzed", "alice@dev.local", "Alice Dev", 78, 5, 4);
        save("BankingSystem",
             "Système bancaire avec gestion de comptes, virements et notifications temps réel.",
             "Spring Boot", "analyzed", "alice@dev.local", "Alice Dev", 62, 3, 11);
        save("CRMPlatform",
             "Gestion de la relation client avec pipeline de vente et reporting.",
             "Symfony", "pending", "bob@dev.local", "Bob Dev", 0, 0, 0);
        save("InventoryService",
             "Service de gestion des stocks avec alertes et prévisions.",
             "Spring Boot", "new", "bob@dev.local", "Bob Dev", 0, 0, 0);
        save("AuthGateway",
             "Service d'authentification centralisé avec OAuth2 et gestion des tokens.",
             "Spring Boot", "analyzed", "admin@dev.local", "Admin Dev", 91, 2, 1);
        save("StorefrontWeb",
             "Frontend Node.js pour la vitrine produits avec rendu SSR.",
             "Node.js", "analyzed", "alice@dev.local", "Alice Dev", 74, 2, 5);
        save("PaymentService",
             "Service de paiement sécurisé avec intégration Stripe et gestion des remboursements.",
             "Spring Boot", "error", "bob@dev.local", "Bob Dev", 0, 1, 3);
        save("ReportingApi",
             "API Laravel de génération de rapports analytiques exportables en PDF et CSV.",
             "Laravel", "analyzed", "alice@dev.local", "Alice Dev", 85, 3, 1);
    }

    private void save(String name, String description, String language, String status,
                      String ownerEmail, String ownerName, int score, int diagramsCount, int violationsCount) {
        projectRepository.save(Project.builder()
                .name(name)
                .description(description)
                .language(language)
                .status(status)
                .ownerEmail(ownerEmail)
                .ownerName(ownerName)
                .score(score)
                .diagramsCount(diagramsCount)
                .violationsCount(violationsCount)
                .build());
    }
}
