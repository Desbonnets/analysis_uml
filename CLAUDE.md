# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**UML Analysis** — SaaS platform for analyzing software architecture with UML diagrams, SOLID violation detection, and AI assistance. Monorepo with a React frontend and Spring Boot microservices backend.

## Commands

### Frontend (`frontend/`)

```bash
npm run dev        # Dev server (requires Node 20.19+ or 22+ — current install is 20.12, incompatible with Vite 8)
npx tsc --noEmit   # Type check without building
npm run lint       # ESLint
npm run build      # tsc -b && vite build (blocked by Node version)
```

### Backend — run each service individually (dev mode)

```bash
cd eureka-server   && ./mvnw spring-boot:run   # Start first — port 8761
cd gateway         && ./mvnw spring-boot:run   # port 8080
cd auth-service    && ./mvnw spring-boot:run   # port 8081
cd user-service    && ./mvnw spring-boot:run   # port 8082
cd service-metier-1 && ./mvnw spring-boot:run  # port 8083
```

### Full stack via Docker

```bash
docker-compose up --build        # Build and start all services
docker-compose up -d postgres eureka-server   # Start infra only
./mvnw test                      # Run tests for a single service (run from service directory)
./mvnw test -Dtest=MyTest        # Run a single test class
```

## Architecture

### Service map

```
Browser → frontend:3000 (Nginx in Docker)
         → gateway:8080 (Spring Cloud Gateway, reactive)
              → auth-service:8081   (Spring Security + JPA, auth_db)
              → user-service:8082   (JPA, user_db)
              → service-metier-1:8083 (JPA, metier1_db)
              ↕ Eureka discovery:8761
```

All services register with Eureka. The gateway routes by service name, not hardcoded URLs.

### Spring profiles

Each service has two property files:
- `application.properties` — local dev (Eureka at `localhost:8761`, datasource at `localhost:5432`)
- `application-docker.properties` — Docker overrides (hostnames become container names)

Activate Docker profile via env var: `SPRING_PROFILES_ACTIVE=docker`

### Frontend data flow

All frontend data is currently **mocked via JSON files** in `src/data/` (`projects.json`, `diagrams.json`, `violations.json`, `users.json`, `ai-messages.json`). These will be replaced with API calls to the gateway. The TypeScript interfaces in `src/types/index.ts` define the shared data shapes.

### Frontend component layers

- `src/components/layout/` — `Layout` (shell), `Sidebar` (nav), `Header` (topbar)
- `src/components/ui/` — `Button`, `Pill`, `Badge`, `Avatar`, `MetricCard`, `StatCard`, `Logo`
- `src/pages/` — one file per route, each renders `<Header>` then page content

## Critical gotchas

- **`@EnableEurekaServer` is mandatory** on `EurekaServerApplication`. Removing it causes a NullPointerException at startup with no clear error message.
- **Gateway must stay reactive** (`spring.main.web-application-type=reactive`). Never add `spring-boot-starter-web` to the gateway — it conflicts with `spring-boot-starter-webflux`.
- **Spring Initializr dependency IDs**: use `cloud-eureka-server`, `cloud-eureka`, `cloud-gateway` — the older names (`eureka-server`, `eureka-client`, `gateway`) resolve to wrong/missing artifacts.
- **Node.js version**: Vite 8 requires Node 20.19+ or 22+. The machine currently has 20.12. `npm run build` will fail until Node is upgraded.
- **New Spring Boot services**: each service needs its own `application-docker.properties` with datasource URL pointing to the `postgres` container and `eureka.client.service-url.defaultZone=http://eureka-server:8761/eureka/`.

## Frontend design conventions

The UI uses a CSS custom property design system defined in `src/index.css`. Follow these rules when writing frontend code:

- **Colors**: use `var(--bg-0..4)`, `var(--fg-0..3)`, `var(--accent)` (#5BC0BE teal), `var(--ok/warn/bad/info)`. Do not use hardcoded hex values or Tailwind color utilities (`text-violet-400`, `bg-slate-700`, etc.).
- **CSS classes**: prefer design system classes (`.btn`, `.card`, `.pill`, `.sidebar`, `.topbar`, `.table`) over inline styles or Tailwind for structural elements.
- **Fonts**: `var(--font-sans)` (Inter) for UI, `var(--font-mono)` (JetBrains Mono) for code, metrics, and numeric values. Apply `.mono` utility class or `font-family: var(--font-mono)` inline.
- **No emojis** in the product UI. No hardcoded French strings outside component files (no string literals scattered in utility functions).
- **Pill vs Badge**: use `<Pill>` for status indicators with `tone` prop (`ok/warn/bad/info/neutral`). `<Badge>` is a thin wrapper that maps old variant names to `<Pill>` — prefer `<Pill>` directly in new code.

## Git workflow

**Never commit directly to `main`.** Every change goes through a branch and a pull request.

### Branch naming
```
feature/short-description    # new feature
fix/short-description        # bug fix
refactor/short-description   # refactoring
chore/short-description      # tooling, deps, config
```

### Workflow for every task
```bash
git checkout -b feature/my-feature   # create branch from main
# ... make changes ...
git add <specific files>             # never git add -A blindly
git commit -m "feat(scope): message" # conventional commit format
git push -u origin feature/my-feature
gh pr create --title "..." --body "..."
```

### Commit rules
- Format: `type(scope): description` — types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`
- **Never add `Co-Authored-By: Claude` or any AI attribution** to commit messages. Commits appear under the git-configured user only.
- Never amend published commits. Create a new commit if a fix is needed after push.
- Stage specific files by name — never `git add .` or `git add -A`.

## Tests

**Run tests after every code change session.** Do not mark a task complete without running the relevant test suite.

```bash
# Frontend — no test framework configured yet (add Vitest before writing tests)
npx tsc --noEmit    # minimum check always required

# Backend (run from each service directory)
./mvnw test                        # all tests
./mvnw test -Dtest=MyServiceTest   # single class
```

When adding or modifying a feature, write or update the corresponding test in the same commit/PR. If no test framework exists for the affected layer, flag it before proceeding.

## Unused code policy

Before deleting any unused function, import, variable, or file:
1. **Signal it explicitly** — list what is unused and why
2. **Ask for confirmation** before removing it
3. Only then delete, in a separate clearly labelled commit (`chore: remove unused X`)

TypeScript enforces `noUnusedLocals` and `noUnusedParameters` — fix these warnings but always announce what is being removed.

## TypeScript rules

TSConfig enforces: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`. All must pass. No `any`, no `@ts-ignore`.

## Backend conventions (Spring Boot services)

- One database per service — services must not share datasources.
- Lombok is available in all services except the gateway (`@Data`, `@Builder`, `@RequiredArgsConstructor`).
- JPA DDL mode is `update` in dev. Add proper migration scripts (Flyway/Liquibase) before any production-facing feature.
- Validation happens at the controller boundary only — not inside service or repository layers.
