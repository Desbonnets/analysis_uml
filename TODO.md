# TODO

Backlog technique — pas des user stories (voir `frontend/USER_STORIES.md` pour le backlog produit).

- [ ] **Outillage de couverture de tests** — aucun rapport de couverture généré aujourd'hui.
  - Backend : ajouter le plugin JaCoCo aux `pom.xml` des services Spring Boot (au moins `project-service`, `auth-service`), lancer via `./mvnw test`.
  - Frontend : ajouter `@vitest/coverage-v8` aux `devDependencies`, lancer `vitest run --coverage`.
