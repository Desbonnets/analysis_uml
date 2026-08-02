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
npm test           # Vitest (unit tests for UI components)
npm run build      # tsc -b && vite build (blocked by Node version)
```

### Backend — run each service individually (dev mode)

```bash
cd eureka-server    && ./mvnw spring-boot:run   # Start first — port 8761
cd gateway          && ./mvnw spring-boot:run   # port 8080
cd auth-service     && ./mvnw spring-boot:run   # port 8081
cd user-service     && ./mvnw spring-boot:run   # port 8082
cd project-service  && ./mvnw spring-boot:run   # port 8083
cd analysis-service && ./mvnw spring-boot:run   # port 8084 (copy mvnw from project-service first)
cd diagram-service  && ./mvnw spring-boot:run   # port 8085
```

> **analysis-service** has no mvnw committed. Copy before first run:
> ```bash
> cp project-service/mvnw analysis-service/ && cp -r project-service/.mvn analysis-service/
> ```

### Full stack via Docker

```bash
docker-compose up --build                              # Build and start all services
docker-compose up -d postgres minio eureka-server      # Start infra only
./mvnw test                                     # All tests for one service (run from service dir)
./mvnw test -Dtest=MyTest                       # Single test class
```

## Architecture

### Service map

All services register with Eureka. The gateway routes by service name, not hardcoded URLs (see `gateway/src/main/resources/application.properties` for the prefix→service mappings, and each service's `application.properties` for ports).

### auth-service

See `auth-service/CLAUDE.md` for internal layout and test setup.

**Security rules in SecurityConfig:**
- `/auth/register`, `/auth/login`, `/actuator/health` → public
- `/users/**` → `ROLE_ADMIN` only
- `/roles/**` → any authenticated user
- everything else → authenticated

### Role system

Roles are a `Role` entity (`roles` table), not strings. `AppUser.role` is a `@ManyToOne`.

| name | displayName | Permissions |
|------|-------------|-------------|
| `admin` | Administrateur | MANAGE_USERS, MANAGE_ROLES, VIEW_ALL_PROJECTS, MANAGE_ALL_PROJECTS, VIEW_ANALYTICS |
| `architect` | Architecte logiciel | CREATE_PROJECT, VIEW_ALL_PROJECTS, MANAGE_OWN_PROJECTS, VIEW_ANALYTICS |
| `developer` | Développeur | CREATE_PROJECT, MANAGE_OWN_PROJECTS, VIEW_OWN_PROJECTS |

Both `DevDataSeeder` (dev) and `ProdDataSeeder` (docker profile) seed roles before users. Permissions are stored as `Set<String>` in `role_permissions` table — informational only, not enforced in code yet.

### Dev seed users (non-docker only)

`DevDataSeeder` (auth-service and project-service) is `@Profile("!docker")` — none of this exists in a docker/prod deployment.

| Email | Password | Role | Plan |
|-------|----------|------|------|
| `admin@dev.local` | `Admin1234!@#` | admin | pro |
| `alice@dev.local` | `Alice1234!@#` | architect | pro |
| `bob@dev.local` | `Bob@Dev1234!` | developer | free |
| `carol@dev.local` | `Carol1234!@#` | admin | pro |
| `dave@dev.local` | `Dave1234!@#` | architect | pro |
| `eve@dev.local` | `Eve@Dev1234!` | developer | free |
| `superadmin@dev.local` | `SuperAdmin1234!@#` | superadmin | pro |

`admin`/`alice`/`bob` and `carol`/`dave`/`eve` are two separate project groups (see `project-service/CLAUDE.md`) — each admin/architect in a group owns one of that group's two seeded projects, so ownership-only edit rights can be tested without the developer accounts.

`superadmin` is a dev-only role: `project-service`'s `SuperAdminGuard` grants it a full view/edit/delete bypass across every project regardless of membership or ownership, gated by a second, independent check (this service's own active Spring profile must not be `docker`) — see `project-service/CLAUDE.md`.

### Spring profiles

Each service has two property files:
- `application.properties` — local dev (Eureka at `localhost:8761`, datasource at `localhost:5432`)
- `application-docker.properties` — Docker overrides (hostnames become container names)

Activate Docker profile: `SPRING_PROFILES_ACTIVE=docker`

In Docker, `ProdDataSeeder` seeds a single admin user configurable via env vars `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

### Frontend

See `frontend/CLAUDE.md` for data flow (wired vs mocked APIs), routing, and component layers.

### analysis-service (port 8084)

See `analysis-service/CLAUDE.md` for internal layout, MinIO config, and storage key format.

### diagram-service (port 8085)

See `diagram-service/CLAUDE.md` for internal layout, endpoints, and mvnw setup.

### project-service (formerly service-metier-1)

See `project-service/CLAUDE.md` for internal layout, authorization rule, and CI integration endpoints.

### user-service

Currently an empty Spring Boot skeleton. Planned for user preferences tied to app features (analysis thresholds, notification settings, activity logs) — things distinct from authentication. Auth CRUD lives in auth-service.

## Critical gotchas

- **`@EnableEurekaServer` is mandatory** on `EurekaServerApplication`. Removing it causes a NullPointerException at startup.
- **Gateway must stay reactive** (`spring.main.web-application-type=reactive`). Never add `spring-boot-starter-web` to the gateway — it conflicts with `spring-boot-starter-webflux`.
- **Spring Initializr dependency IDs**: use `cloud-eureka-server`, `cloud-eureka`, `cloud-gateway` — the older names resolve to wrong/missing artifacts.
- **Node.js version**: Vite 8 requires Node 20.19+ or 22+. The machine currently has 20.12. `npm run build` will fail until Node is upgraded.
- **New Spring Boot services**: each service needs its own `application-docker.properties` with datasource URL pointing to the `postgres` container and `eureka.client.service-url.defaultZone=http://eureka-server:8761/eureka/`.
- **analysis-service has no mvnw**: copy from project-service before running locally. Docker build works without it (uses Maven base image).
- **MinIO bucket**: created automatically by `StorageService@PostConstruct` on startup. If MinIO is unreachable, the service fails to start — start MinIO first.
- **Role migration**: `AppUser.role` is now a FK (`role_id`). With `ddl-auto=update`, the old `role VARCHAR` column is NOT dropped automatically. On a fresh DB this is fine; on an existing dev DB, drop and recreate `auth_db` before first run.
- **Password constraint** (register + admin create): min 12 chars, requires uppercase + lowercase + digit + special char. Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$`
- **Email change logs out the user**: JWT contains the old email. After changing email via `PUT /auth/me`, the current token becomes invalid on the next authenticated request. The user must log in again.

Frontend design conventions (CSS custom property system, colors, fonts, Pill vs Badge) are in `frontend/CLAUDE.md`.

## Git workflow

**Never commit directly to `main`.** Every change goes through a branch and a pull request.

```bash
git checkout -b feature/my-feature
git add <specific files>              # never git add -A or git add .
git commit -m "feat(scope): message"  # types: feat fix refactor chore docs test
git push -u origin feature/my-feature
gh pr create --title "..." --body "..."
```

Never add `Co-Authored-By: Claude` or any AI attribution to commits. Never amend published commits.

## Tests

**Run after every code change session before marking a task complete.**

```bash
# Frontend
npx tsc --noEmit          # always required
npm test                   # Vitest — component unit tests in src/**/*.test.tsx

# Backend (from each service directory)
./mvnw test
./mvnw test -Dtest=MyServiceTest
```

When adding a feature, write or update tests in the same PR. See `auth-service/CLAUDE.md` for its test setup (H2, seeded users, JWT-based integration tests).

## Unused code policy

Before deleting any unused function, import, variable, or file:
1. **Signal it explicitly** — list what is unused and why
2. **Ask for confirmation** before removing it
3. Only then delete, in a separate labelled commit (`chore: remove unused X`)

TypeScript enforces `noUnusedLocals` and `noUnusedParameters` — fix warnings but always announce removals.

## Backend conventions (Spring Boot services)

- One database per service — services must not share datasources.
- Lombok available in all services except gateway (`@Data`, `@Builder`, `@RequiredArgsConstructor`).
- JPA DDL mode is `update` in dev. Add Flyway/Liquibase before any production-facing feature.
- Validation at the controller boundary only (`@Valid` on `@RequestBody`), not in service or repository layers.
- `LocalDateTime` fields serialize as ISO-8601 strings (`spring.jackson.serialization.write-dates-as-timestamps=false` set in auth-service).
