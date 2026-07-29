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
7. ✅ **Projets récents** — En tant qu'utilisateur, je veux voir la liste des 5 projets les plus récents avec langage, nombre de diagrammes, violations et score.
8. ✅ **Actualisation manuelle** — En tant qu'utilisateur, je veux pouvoir rafraîchir les données du dashboard sans recharger la page.
9. 🧪 **Flux d'activité** — En tant qu'utilisateur, je veux voir les actions récentes de mon équipe (commits, commentaires, analyses CI) pour rester informé.

## Épopée 3 — Gestion des projets

10. ✅ **Lister mes projets** — En tant qu'utilisateur, je veux voir tous mes projets sous forme de cartes (langage, statut, score, membres).
11. ✅ **Rechercher un projet** — En tant qu'utilisateur, je veux rechercher un projet par nom.
12. ✅ **Filtrer par statut** — En tant qu'utilisateur, je veux filtrer mes projets par statut (Tous / Analysé / En cours / Nouveau).
13. ✅ **Créer un projet** — En tant qu'utilisateur, je veux créer un projet (nom, description, URL de dépôt optionnelle, langage/framework).
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
65. ✅ **Réutiliser un diagramme enregistré pour un contrôle de conformité** — En tant qu'utilisateur, je veux choisir un diagramme UML déjà enregistré dans l'onglet Conformité au lieu de le re-coller à chaque vérification.
66. ✅ **Filtrer le périmètre d'un contrôle de conformité** — En tant qu'utilisateur, je veux restreindre la vérification de conformité (entités BDD seules, types de classe, package) pour comparer mon diagramme de référence à un sous-ensemble du code (ex. juste le schéma de base de données) plutôt qu'à toutes les classes de l'application.

## Épopée 11 — Couverture des tests vs exigences

67. 🚧 **Vérifier que les tests couvrent les user stories / cas d'usage** — En tant qu'utilisateur, je veux fournir mon référentiel d'exigences (user stories, cas d'usage) et voir quelles fonctionnalités n'ont aucun test correspondant, en priorité via un identifiant explicite sur le test et, à défaut, via une correspondance par mots-clés clairement marquée comme non certaine. Voir `docs/test-coverage-analysis.md` pour la conception détaillée (non implémenté).
68. 🚧 **Choisir le niveau de précision d'un contrôle de conformité** — En tant qu'utilisateur, je veux configurer jusqu'à quel niveau de détail la conformité est vérifiée (attributs, méthodes, exceptions) car aujourd'hui seule la structure (classes, types, relations) est comparée — deux classes de même nom avec des attributs différents ne remontent aucun écart. Voir `diagram-service/docs/conformance-precision.md` pour la conception détaillée (non implémenté).
