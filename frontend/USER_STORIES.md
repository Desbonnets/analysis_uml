# User stories — Frontend

Backlog des fonctionnalités du frontend (`frontend/src`), formulées en user stories.
Ce fichier est maintenu à la main par l'équipe et mis à jour par Claude Code lors de l'ajout de nouvelles fonctionnalités frontend (voir `frontend/CLAUDE.md`).

**Légende statut :**
- ✅ Fonctionnel — branché à une vraie API backend
- 🧪 Mocké — UI fonctionnelle mais données statiques (`src/data/*.json`)
- 🚧 Non branché — élément UI présent (bouton, champ) sans action réelle

---

## Épopée 1 — Authentification

1. ✅ **Connexion** — En tant qu'utilisateur enregistré, je veux me connecter avec mon e-mail et mot de passe afin d'accéder à mon espace de travail.
2. ✅ **Inscription** — En tant que nouvel utilisateur, je veux créer un compte (nom, e-mail, rôle, mot de passe) afin de commencer à analyser mes projets.
3. ✅ **Choix du rôle à l'inscription** — En tant que nouvel utilisateur, je veux indiquer mon rôle (Développeur / Architecte / Admin) afin que mes permissions soient adaptées dès la création du compte.
4. ✅ **Déconnexion implicite après changement d'e-mail** — En tant qu'utilisateur, je veux être informé que je dois me reconnecter après avoir changé mon e-mail, car mon token devient invalide.
5. 🚧 **Connexion via GitHub** — bouton présent mais désactivé.

## Épopée 2 — Tableau de bord

6. ✅ **Vue d'ensemble** — En tant qu'utilisateur connecté, je veux voir en un coup d'œil le nombre de projets analysés, de diagrammes générés, de violations actives et le score moyen d'architecture.
7. ✅ **Projets récents** — En tant qu'utilisateur, je veux voir la liste des 5 projets triés par date de dernière modification (les plus récemment modifiés en premier), avec langage, nombre de diagrammes, violations et score.
8. ✅ **Actualisation manuelle** — En tant qu'utilisateur, je veux pouvoir rafraîchir les données du dashboard sans recharger la page.
9. ✅ **Diagrammes UML récents** — En tant qu'utilisateur, je veux voir les 5 diagrammes UML enregistrés les plus récemment modifiés (nom, projet associé, date), avec accès direct à chacun. Remplace l'ancien flux d'activité mocké (commits/commentaires fictifs), qui n'avait pas de source de données réelle — voir item 70.

## Épopée 3 — Gestion des projets

10. ✅ **Lister mes projets** — En tant qu'utilisateur, je veux voir tous les projets dont je suis membre sous forme de cartes (langages, statut, nombre réel de diagrammes enregistrés, violations, membres, nombre d'analyses effectuées) — y compris en tant qu'admin, qui n'a pas d'accès élargi ici (voir item 74). Le nombre de diagrammes vient de `listSavedUmlDiagrams` (diagram-service) et le nombre d'analyses de `getAnalysisHistory` (analysis-service), agrégés côté client par projet — plus de compteur statique. Le tag de statut "Nouveau" n'est plus affiché (peu utile tant qu'aucune analyse n'a été lancée).
11. ✅ **Rechercher un projet** — En tant qu'utilisateur, je veux rechercher un projet par nom.
12. ✅ **Filtrer par statut** — En tant qu'utilisateur, je veux filtrer mes projets par statut (Tous / Analysé / En cours).
13. ✅ **Créer un projet** — En tant qu'utilisateur, je veux créer un projet (nom, description, URL de dépôt optionnelle, un ou plusieurs langages/frameworks, logo optionnel).
14. ✅ **Supprimer un projet** — En tant que propriétaire d'un projet, je veux le supprimer (avec confirmation).
15. ✅ **Voir les membres d'un projet** — En tant qu'utilisateur, je veux voir les avatars et rôles des membres associés à un projet.
16. ✅ **Accès restreint à la suppression** — En tant qu'utilisateur non-propriétaire, je ne dois pas voir l'option de suppression sur un projet qui n'est pas le mien.

## Épopée 4 — Détail projet & analyse de code

17. ✅ **Uploader un ZIP pour analyse** — En tant qu'utilisateur, je veux uploader une archive ZIP de mon code source afin de générer une analyse et des diagrammes UML.
18. ✅ **Suivre la progression de l'upload** — En tant qu'utilisateur, je veux voir une barre de progression (% et taille) pendant l'upload du fichier.
19. ✅ **Suivre l'état de l'analyse serveur** — En tant qu'utilisateur, je veux voir un indicateur "analyse en cours" pendant le traitement côté serveur.
20. ✅ **Consulter le résultat d'une analyse** — En tant qu'utilisateur, je veux voir le nombre de fichiers analysés et de classes trouvées dans une modale de résultat.
21. ✅ **Gérer les erreurs d'analyse** — En tant qu'utilisateur, je veux être averti clairement si une analyse échoue, avec possibilité de fermer le message.
22. ✅ **Empêcher les analyses concurrentes** — En tant qu'utilisateur, je veux être informé si une analyse est déjà en cours sur un autre projet.
23. 🧪 **Voir le score d'architecture** — En tant qu'utilisateur, je veux voir le score global (/100) ainsi que le détail par catégorie (SOLID, couplage, cohésion, patterns).
24. ✅ **Voir l'historique des analyses UML** — En tant qu'utilisateur, je veux voir les 5 dernières analyses UML d'un projet avec accès direct au diagramme.
25. ✅ **Générer un token API projet (CI)** — En tant que propriétaire d'un projet, je veux générer/régénérer un token API afin d'intégrer l'analyse à un pipeline CI/CD.
26. ✅ **Copier le token et le snippet CI** — En tant que propriétaire, je veux copier le token et un exemple de step GitHub Actions en un clic.
27. 🚧 **Violations (à venir)** — En tant qu'utilisateur, je veux savoir que la détection de violations via SonarQube arrive prochainement.

## Épopée 5 — Diagrammes UML

28. ✅ **Sélectionner un projet pour visualiser ses diagrammes** — En tant qu'utilisateur, je veux choisir un projet dans une liste déroulante afin de voir son historique d'analyses.
29. ✅ **Consulter l'historique des analyses d'un projet** — En tant qu'utilisateur, je veux voir un tableau (date, fichiers, classes, langages non supportés) pour choisir quelle analyse visualiser.
30. ✅ **Visualiser le diagramme de classes** — En tant qu'utilisateur, je veux voir un diagramme de classes UML (classes, interfaces, classes abstraites, enums) avec relations (extends, implements, uses, cardinalités JPA).
31. ✅ **Visualiser le graphe de dépendances** — En tant qu'utilisateur, je veux voir les dépendances entre classes du projet.
32. ✅ **Visualiser le diagramme de packages** — En tant qu'utilisateur, je veux voir l'organisation en packages et leurs dépendances.
33. ✅ **Filtrer le diagramme de classes** — En tant qu'utilisateur, je veux filtrer par type (classe/abstraite/interface/enum), par "entités seules", ou par nom de package.
34. ✅ **Zoomer / dézoomer / réinitialiser la vue** — En tant qu'utilisateur, je veux zoomer, dézoomer et recentrer le diagramme.
35. ✅ **Exporter le diagramme** — En tant qu'utilisateur, je veux exporter le diagramme de classes, de dépendances ou de packages généré depuis le code au format PlantUML (.puml) afin de le réutiliser ailleurs (versionner, l'utiliser comme diagramme de référence pour un contrôle de conformité).
36. ✅ **Vérifier la conformité vs un diagramme de référence** — En tant qu'utilisateur, je veux coller ou importer un fichier PlantUML décrivant l'architecture attendue et comparer avec le code réel afin de détecter les écarts (erreurs/infos).
37. ✅ **Gérer les erreurs de chargement du diagramme** — En tant qu'utilisateur, je veux un message clair si le diagram-service est indisponible ou si l'analyse est introuvable.

## Épopée 6 — Analyse & violations (données mockées)

38. 🧪 **Voir les compteurs de sévérité** — En tant qu'utilisateur, je veux voir le nombre de violations critiques/importantes/moyennes/mineures.
39. 🧪 **Filtrer les violations** — En tant qu'utilisateur, je veux filtrer par projet, sévérité et type (SOLID, dépendance, architecture, pattern).
40. 🧪 **Déplier le détail d'une violation** — En tant qu'utilisateur, je veux cliquer sur une violation pour voir sa description complète et sa localisation (fichier:ligne).
41. 🚧 **Exporter / re-lancer une analyse** — boutons présents, non branchés.

## Épopée 7 — Assistant IA (mocké)

42. 🧪 **Discuter avec l'assistant** — En tant qu'utilisateur, je veux poser une question en langage naturel sur mon architecture et recevoir une réponse.
43. 🧪 **Utiliser des suggestions prédéfinies** — En tant qu'utilisateur, je veux cliquer sur une suggestion pour démarrer rapidement une conversation.
44. ✅ **Copier une réponse** — En tant qu'utilisateur, je veux copier le contenu d'une réponse de l'IA.
45. ✅ **Voir le rendu markdown/code** — En tant qu'utilisateur, je veux que les blocs de code et le texte en gras soient correctement formatés dans les réponses.

## Épopée 8 — Paramètres du compte

46. ✅ **Modifier mon profil** — En tant qu'utilisateur, je veux modifier mon nom et mon e-mail.
47. ✅ **Changer mon mot de passe** — En tant qu'utilisateur, je veux changer mon mot de passe en fournissant l'ancien et le nouveau (avec règles de complexité affichées).
48. ✅ **Voir mon rôle et mon plan** — En tant qu'utilisateur, je veux voir mon rôle (badge) et mon plan actuel.
49. 🚧 **Configurer les seuils d'analyse** — En tant qu'architecte, je veux configurer le seuil de couplage (CBO), le seuil LCOM et la profondeur d'analyse. (UI présente, non persistée à l'API)
50. 🚧 **Activer l'analyse automatique** — En tant qu'utilisateur, je veux activer "analyse à chaque push" et "bloquer la PR sur issue critique". (UI présente, non branchée)
51. ✅ **Voir l'équipe (admin uniquement)** — En tant qu'admin, je veux voir la liste des membres de l'organisation (rôle, plan, date d'ajout) depuis les Paramètres.
52. ✅ **Accès restreint à l'onglet Équipe** — En tant qu'utilisateur non-admin, je dois voir un message m'indiquant que cette section est réservée aux administrateurs.
53. 🧪 **Voir/gérer les intégrations** — En tant qu'utilisateur, je veux voir l'état de connexion de GitHub, GitLab, Slack, Jira. (mock statique)
54. 🧪 **Voir mon plan de facturation et les offres** — En tant qu'utilisateur, je veux voir mon plan actuel et comparer les offres Free/Pro/Équipe. (pas de paiement réel)

## Épopée 9 — Administration (rôle `admin` uniquement)

55. ✅ **Lister tous les utilisateurs** — En tant qu'admin, je veux voir tous les utilisateurs de la plateforme (nom, e-mail, rôle, plan, date d'inscription).
56. ✅ **Filtrer les utilisateurs** — En tant qu'admin, je veux filtrer par rôle et par plan.
57. ✅ **Créer un utilisateur** — En tant qu'admin, je veux créer un compte utilisateur en définissant nom, e-mail, mot de passe, rôle et plan.
58. ✅ **Modifier le rôle d'un utilisateur** — En tant qu'admin, je veux changer le rôle d'un utilisateur directement depuis le tableau, avec retour d'erreur si l'opération échoue.
59. ✅ **Supprimer un utilisateur** — En tant qu'admin, je veux supprimer un utilisateur (avec confirmation), sauf mon propre compte.
60. ✅ **Accès protégé** — En tant qu'utilisateur non-admin, je dois être redirigé vers `/dashboard` si je tente d'accéder à `/admin/users`.

## Épopée 10 — Bibliothèque de diagrammes UML enregistrés

61. ✅ **Lister les diagrammes UML enregistrés** — En tant qu'utilisateur, je veux voir tous les diagrammes PlantUML que j'ai enregistrés (nom, projet associé, date de mise à jour).
62. ✅ **Créer un diagramme UML de référence** — En tant qu'utilisateur, je veux écrire ou importer un fichier PlantUML, éventuellement l'associer à un projet, et l'enregistrer pour le réutiliser plus tard.
63. ✅ **Aperçu visuel fidèle pendant la saisie** — En tant qu'utilisateur, je veux voir un rendu visuel exact (moteur PlantUML officiel, rendu localement, sans appel réseau) de mon diagramme au fur et à mesure de la saisie, couvrant toute la syntaxe des diagrammes de classes (visibilité, membres statiques/abstraits, génériques, tous les types de relations, notes, packages, couleurs, hide/show…).
64. ✅ **Modifier / supprimer un diagramme enregistré** — En tant que propriétaire d'un diagramme UML, je veux le modifier ou le supprimer (les autres utilisateurs ne le peuvent pas).
65. ✅ **Réutiliser un diagramme enregistré pour un contrôle de conformité** — En tant qu'utilisateur, je veux choisir un diagramme UML déjà enregistré dans la page Conformité au lieu de le re-coller à chaque vérification.
66. ✅ **Filtrer le périmètre d'un contrôle de conformité** — En tant qu'utilisateur, je veux restreindre la vérification de conformité (entités BDD seules, types de classe, package) pour comparer mon diagramme de référence à un sous-ensemble du code (ex. juste le schéma de base de données) plutôt qu'à toutes les classes de l'application.
67. ✅ **Choisir le niveau de précision d'un contrôle de conformité** — En tant qu'utilisateur, je veux configurer jusqu'à quel niveau de détail la conformité est vérifiée (attributs, méthodes, exceptions) car auparavant seule la structure (classes, types, relations) était comparée — deux classes de même nom avec des attributs différents ne remontaient aucun écart. Toggles "Attributs"/"Méthodes" dans la page Conformité, opt-in (défaut inchangé). Le toggle "Exceptions" reste désactivé/grisé — bloqué en amont sur `analysis-service`, voir `diagram-service/docs/conformance-precision.md`.
68. ✅ **Page Conformité dédiée** — En tant qu'utilisateur, je veux que le contrôle de conformité soit accessible directement depuis la sidebar (`/conformance`), avec son propre sélecteur projet/analyse, plutôt qu'enfoui comme un onglet parmi les onglets de visualisation de `DiagramEditor` — plus clair et plus facile à trouver.

## Épopée 11 — Couverture des tests vs exigences

69. ✅ **Vérifier que les tests couvrent les user stories / cas d'usage** — En tant qu'utilisateur, je veux fournir mon référentiel d'exigences (user stories, cas d'usage) et voir quelles fonctionnalités n'ont aucun test correspondant, en priorité via un identifiant explicite sur le test (`@Tag`/`@group`) et, à défaut, via une correspondance par mots-clés clairement marquée comme non certaine (⚠️ Heuristique). Page dédiée "Couverture des tests" accessible depuis la sidebar (`/test-coverage`), avec son propre sélecteur projet/analyse. Détection des tests limitée à Java et PHP pour l'instant — voir `docs/test-coverage-analysis.md`. Vérifié manuellement de bout en bout sur un projet Java ; le détecteur PHP n'a été validé que par ses tests unitaires (`PhpLanguageParserTest`), pas manuellement bout en bout, faute de projet PHP sous la main.

## Épopée 2 (suite) — Widget dashboard "Analyses récentes"

70. 🚧 **Analyses de conformité/tests récentes sur le tableau de bord** — En tant qu'utilisateur, je veux voir mes 5 dernières analyses de conformité et de couverture des tests enregistrées, afin de suivre l'évolution de la qualité de mes projets sans devoir tout relancer manuellement. Widget dashboard en place (état vide pour l'instant, "Aucune analyse enregistrée") — la sauvegarde des résultats de `ConformanceReportDto` (item 36) et `TestCoverageReportDto` (item 69) n'est pas encore implémentée côté `diagram-service` (aujourd'hui calculés à la volée à chaque vérification, jamais persistés). Fonctionnalité à construire : nouvelle entité + endpoint de sauvegarde (même pattern que `SavedUmlDiagram`, épopée 10) et un bouton "Enregistrer le résultat" sur les pages Conformité et Couverture des tests.

## Épopée 3 (suite) — Gestion des projets

71. ✅ **Choisir plusieurs langages pour un projet** — En tant qu'utilisateur, je veux associer un ou plusieurs langages/frameworks à un projet (création et modification) plutôt qu'un seul, un projet réel mélangeant souvent plusieurs technologies. `Project.language` (String) devient `Project.languages` (liste, table `project_languages`) côté `project-service`.
72. ✅ **Modifier un projet** — En tant que propriétaire d'un projet, je veux modifier son nom, sa description, son URL de dépôt et ses langages depuis la page Projets, sans devoir le recréer.
73. ✅ **Changer le logo d'un projet** — En tant que propriétaire d'un projet, je veux définir une image comme logo du projet (comme une photo de profil), recadrée et redimensionnée côté client puis stockée en data URL (`Project.logoUrl`, colonne TEXT côté `project-service`) — pas d'infrastructure de stockage de fichiers dédiée pour l'instant.
74. ✅ **Aucun accès élargi pour les admins sur les projets** — En tant qu'utilisateur (y compris admin), je ne dois voir/lister que les projets dont je suis membre, et ne pouvoir modifier/supprimer que ceux dont je suis propriétaire — pas de bypass admin. `ProjectService.findAll`/`findById`/`getMembers` (project-service) ne prennent plus de flag `isAdmin` ; `ProjectController.isAdmin(auth)` a été supprimé (devenu inutilisé).
75. ✅ **Super admin dev-only avec accès total aux projets** — En tant que développeur de la plateforme, je veux un compte capable de voir/modifier/supprimer n'importe quel projet en local, sans jamais pouvoir exister en production. Nouveau rôle `superadmin` (seedé uniquement par `DevDataSeeder`, jamais par `ProdDataSeeder`) + `SuperAdminGuard` (project-service) qui exige en plus que le profil Spring actif ne soit pas `docker` — double verrou. `DevDataSeeder` des deux services est passé en `@Profile("!docker")` (il ne l'était pas, donc les comptes/projets de dev auraient pu être seedés même en déploiement docker).
