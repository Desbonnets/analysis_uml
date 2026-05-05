Cahier des charges – Plateforme UML + IA + Analyse d’Architecture Logicielle
Projet de création d’une plateforme moderne de modélisation UML et d’analyse d’architecture logicielle assistée par intelligence artificielle.

1. Vision du projet
Créer une plateforme SaaS moderne capable de générer automatiquement des diagrammes UML, analyser l’architecture d’un projet logiciel, détecter les problèmes de conception, comparer UML et code source, et proposer des améliorations grâce à l’IA.

2. Objectifs principaux
Génération UML automatique depuis le code
Création manuelle de diagrammes UML
Synchronisation UML ↔ Code
Comparaison UML théorique ↔ Architecture réelle
Détection de dette technique et violations d’architecture
Assistant IA pour recommandations et refactoring
Visualisation moderne et interactive

3. Stack technique
Frontend : React + Vite + TypeScript + Tailwind
Backend : Architecture microservices avec Spring Boot
Communication : REST + WebSocket
Base de données : PostgreSQL
Authentification : JWT + Refresh Token
Conteneurisation : Docker
Orchestration future : Kubernetes
IA : API OpenAI / modèles spécialisés futurs

4. Architecture microservices
API Gateway
Service Authentification
Service UML
Service Analyse de Code
Service IA
Service Projet
Service Comparaison Architecture
Service Notifications
Base PostgreSQL par service si nécessaire

5. Fonctionnalités MVP
Import de projet Spring Boot/Symfony
Parsing automatique du code
Génération diagramme de classes
Interface graphique interactive
Sauvegarde des projets UML
Export PNG/SVG
Thème sombre
Recherche dans les diagrammes
6. Analyse statique du code

Le système devra analyser :
Classes
Interfaces
Méthodes
Héritage
Dépendances
Injection de dépendances
Packages/modules
Relations entre composants

7. Fonctionnalités UML
Création manuelle de diagrammes
Génération UML automatique
Diagrammes de classes
Diagrammes de dépendances
Diagrammes de packages
Diagrammes de séquence (future version)
Auto-layout intelligent
Drag & Drop

8. Comparaison UML ↔ Code

Fonctionnalité centrale du projet.

Le système devra comparer le diagramme UML théorique avec le projet réel afin de détecter :
Dépendances interdites
Violations d’architecture
Classes manquantes
Code non documenté dans UML
Cycles de dépendances
Violations SOLID
Architecture dégradée

9. Assistant IA
L’IA devra être capable de :

Expliquer une architecture
Détecter les problèmes de conception
Suggérer des refactorings
Générer UML depuis une description texte
Générer du code depuis UML
Détecter les anti-patterns
Donner un score qualité architecture

10. UX/UI
Interface moderne
Zoom fluide
Mini-map
Recherche globale
Thème sombre
Navigation rapide
Interface inspirée de Figma/Miro

11. Sécurité
JWT sécurisé
Refresh token HTTP Only
Gestion des rôles
Isolation des projets
Logs et monitoring

12. Roadmap

Phase 1 : MVP UML
Phase 2 : Analyse architecture
Phase 3 : IA et recommandations
Phase 4 : SaaS collaboratif
Phase 5 : Marketplace/plugins

13. Business Model
SaaS B2B
Offre gratuite limitée
Abonnement Pro
IA avancée en premium
Collaboration équipe

14. Différenciation
Le projet ne doit pas être un simple éditeur UML.

Il doit devenir un véritable copilote intelligent d’architecture logicielle capable de maintenir la cohérence entre le code réel et l’architecture théorique.

15. Évolutions futures

Collaboration temps réel
Synchronisation Git
Historique architecture
Heatmap dette technique
Plugins IDE
Analyse microservices
Génération de documentation automatique
 
Conclusion
Ce projet vise à créer une plateforme innovante combinant UML, analyse d’architecture logicielle et intelligence artificielle. L’objectif est de résoudre les problèmes de documentation obsolète, dette technique et compréhension des architectures complexes.


16. Use Cases du projet
UC-01 – Importer un projet
 Acteur : Développeur
Description : L’utilisateur importe un projet Spring Boot ou Symfony afin d’analyser son architecture.
Préconditions : Projet disponible localement ou via Git.
Résultat attendu : Le projet est parsé et prêt à être analysé.
UC-02 – Générer automatiquement un diagramme UML
 Acteur : Développeur
Description : Génération automatique des diagrammes UML depuis le code source.
Préconditions : Projet analysé.
Résultat attendu : Diagramme de classes et dépendances affichés.
UC-03 – Créer un diagramme UML manuellement
 Acteur : Architecte logiciel
Description : Création manuelle de diagrammes UML via l’éditeur visuel.
Préconditions : Projet ou espace de travail ouvert.
Résultat attendu : Diagramme sauvegardé.
UC-04 – Comparer UML et code source
 Acteur : Architecte logiciel
Description : Comparaison entre l’architecture théorique UML et l’architecture réelle du code.
Préconditions : UML et projet importés.
Résultat attendu : Affichage des différences et violations.
UC-05 – Détecter les violations d’architecture
 Acteur : Développeur / Architecte
Description : Le système détecte automatiquement les dépendances interdites et anti-patterns.
Préconditions : Analyse terminée.
Résultat attendu : Rapport des violations.
UC-06 – Recevoir des recommandations IA
 Acteur : Développeur
Description : L’IA analyse le projet et propose des améliorations.
Préconditions : Projet analysé.
Résultat attendu : Suggestions de refactoring et amélioration architecture.
UC-07 – Générer du code depuis UML
 Acteur : Développeur
Description : Génération automatique de classes/interfaces depuis le diagramme UML.
Préconditions : Diagramme UML existant.
Résultat attendu : Code source généré.
UC-08 – Synchroniser UML et code
 Acteur : Développeur
Description : Synchronisation bidirectionnelle entre diagrammes et code source.
Préconditions : Projet lié à un diagramme.
Résultat attendu : UML et code restent cohérents.
UC-09 – Exporter les diagrammes
 Acteur : Développeur
Description : Export des diagrammes en PNG, SVG ou PDF.
Préconditions : Diagramme disponible.
Résultat attendu : Fichier exporté.
UC-10 – Collaborer sur un projet
 Acteur : Équipe de développement
 Description : Plusieurs utilisateurs travaillent simultanément sur la même architecture.
 Préconditions : Projet partagé.
 Résultat attendu : Collaboration temps réel.
Acteurs principaux
 Développeur
 Architecte logiciel
 Chef de projet
 Administrateur
 IA d’analyse architecture
Gestion des comptes et authentification
UC-11 – Créer un compte
Acteur : Utilisateur invité
 Description : Un utilisateur crée un compte afin d’accéder à la plateforme.
 Préconditions : Adresse e-mail valide.
 Résultat attendu : Compte utilisateur créé et accessible.

UC-12 – Se connecter
Acteur : Utilisateur enregistré
 Description : L’utilisateur se connecte à la plateforme avec ses identifiants.
 Préconditions : Compte existant.
 Résultat attendu : Session utilisateur ouverte.

UC-13 – Réinitialiser son mot de passe
Acteur : Utilisateur enregistré
 Description : L’utilisateur demande la réinitialisation de son mot de passe.
 Préconditions : Adresse e-mail associée à un compte.
 Résultat attendu : Nouveau mot de passe défini.

UC-14 – Gérer son profil
Acteur : Utilisateur enregistré
 Description : Modification des informations personnelles et préférences utilisateur.
 Préconditions : Utilisateur connecté.
 Résultat attendu : Profil mis à jour.

UC-15 – Se déconnecter
Acteur : Utilisateur enregistré
 Description : L’utilisateur ferme sa session.
 Préconditions : Session active.
 Résultat attendu : Session terminée de manière sécurisée.

Gestion des droits et administration
UC-16 – Créer une organisation / équipe
Acteur : Administrateur / Chef de projet
 Description : Création d’un espace de travail partagé pour une équipe de développement.
 Préconditions : Compte administrateur valide.
 Résultat attendu : Organisation créée.

UC-17 – Inviter des membres
Acteur : Administrateur / Chef de projet
 Description : Invitation d’utilisateurs dans un projet ou une organisation.
 Préconditions : Organisation existante.
 Résultat attendu : Utilisateur ajouté à l’équipe.

UC-18 – Attribuer des rôles et permissions
Acteur : Administrateur
 Description : Attribution des droits d’accès selon le rôle utilisateur.
 Préconditions : Utilisateur membre d’une organisation.
 Résultat attendu : Permissions appliquées.

UC-19 – Gérer les accès aux projets
Acteur : Administrateur / Chef de projet
 Description : Définition des droits de lecture, modification ou administration d’un projet.
 Préconditions : Projet existant.
 Résultat attendu : Accès configurés correctement.

UC-20 – Consulter les journaux d’activité
Acteur : Administrateur
 Description : Consultation des actions effectuées sur les projets et diagrammes.
 Préconditions : Historique disponible.
 Résultat attendu : Journal d’activité affiché.

Gestion des abonnements et paiements
UC-21 – Consulter les offres d’abonnement
Acteur : Utilisateur invité / Utilisateur enregistré
 Description : Consultation des différentes offres disponibles (Free, Pro, Entreprise…).
 Préconditions : Aucune.
 Résultat attendu : Liste des abonnements affichée.

UC-22 – Souscrire à un abonnement
Acteur : Utilisateur enregistré
 Description : L’utilisateur choisit une formule et effectue un paiement.
 Préconditions : Compte connecté.
 Résultat attendu : Abonnement activé.

UC-23 – Renouveler un abonnement
Acteur : Utilisateur enregistré
 Description : Renouvellement automatique ou manuel d’un abonnement expirant.
 Préconditions : Abonnement existant.
 Résultat attendu : Abonnement prolongé.

UC-24 – Résilier un abonnement
Acteur : Utilisateur enregistré
 Description : L’utilisateur annule son abonnement payant.
 Préconditions : Abonnement actif.
 Résultat attendu : Abonnement arrêté à échéance.

UC-25 – Consulter les factures
Acteur : Utilisateur enregistré
 Description : Consultation et téléchargement des factures liées aux paiements.
 Préconditions : Paiements effectués.
 Résultat attendu : Factures disponibles au téléchargement.

UC-26 – Gérer les moyens de paiement
Acteur : Utilisateur enregistré
 Description : Ajout, modification ou suppression des moyens de paiement.
 Préconditions : Compte connecté.
 Résultat attendu : Moyen de paiement mis à jour.

UC-27 – Vérifier les limitations du plan
Acteur : Système
 Description : Le système contrôle les fonctionnalités accessibles selon l’abonnement utilisateur.
 Préconditions : Utilisateur connecté.
 Résultat attendu : Accès autorisé ou restreint selon le plan.

Cas d’utilisation IA avancés (optionnel mais pertinent)
UC-28 – Générer un rapport d’architecture
Acteur : Architecte logiciel
 Description : Génération automatique d’un rapport détaillé sur la qualité architecturale du projet.
 Préconditions : Analyse terminée.
 Résultat attendu : Rapport exportable généré.

UC-29 – Prédire les risques architecturaux
Acteur : IA d’analyse architecture
 Description : L’IA identifie les zones à risque dans le projet (fort couplage, dette technique, dépendances critiques).
 Préconditions : Projet analysé.
 Résultat attendu : Liste des risques et recommandations.

UC-30 – Historiser les versions des diagrammes
Acteur : Développeur / Architecte logiciel
 Description : Sauvegarde des différentes versions d’un diagramme UML.
 Préconditions : Diagramme existant.
 Résultat attendu : Historique consultable et restaurable.