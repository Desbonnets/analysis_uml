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
cd eureka-server   && ./mvnw spring-boot:run   # Start first — port 8761
cd gateway         && ./mvnw spring-boot:run   # port 8080
cd auth-service    && ./mvnw spring-boot:run   # port 8081
cd user-service    && ./mvnw spring-boot:run   # port 8082
cd project-service && ./mvnw spring-boot:run   # port 8083
```

### Full stack via Docker

```bash
docker-compose up --build                       # Build and start all services
docker-compose up -d postgres eureka-server     # Start infra only
./mvnw test                                     # All tests for one service (run from service dir)
./mvnw test -Dtest=MyTest                       # Single test class
```

## Architecture

### Service map

```
Browser → frontend:3000 (Nginx in Docker)
         → gateway:8080 (Spring Cloud Gateway, reactive)
              → auth-service:8081    (Spring Security + JPA, auth_db)
              → user-service:8082    (JPA, user_db)  ← skeleton, not yet implemented
              → project-service:8083 (JPA, metier1_db — project CRUD)
              ↕ Eureka discovery:8761
```

All services register with Eureka. The gateway routes by service name, not hardcoded URLs.

### Gateway routes (application.properties)

| Prefix | Target service |
|--------|---------------|
| `/auth/**` | auth-service |
| `/users/**` | auth-service |
| `/roles/**` | auth-service |
| `/projects/**` | project-service |

### auth-service internal layout

```
entity/     AppUser (app_users table), Role (roles table, role_permissions table)
repository/ UserRepository, RoleRepository
dto/        AuthResponse, LoginRequest, RegisterRequest
            UserAdminDto, RoleDto (admin API responses)
            AdminCreateUserRequest, AdminUpdateUserRequest
            UpdateProfileRequest (own profile)
service/    AuthService (login/register), UserManagementService (CRUD + profile),
            RoleService (list roles)
controller/ AuthController (/auth/**), UserController (/users/**), RoleController (/roles/**)
security/   JwtUtil, JwtAuthFilter, CustomUserDetailsService
config/     SecurityConfig, DevDataSeeder, ProdDataSeeder
```

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

| Email | Password | Role | Plan |
|-------|----------|------|------|
| `admin@dev.local` | `Admin1234!@#` | admin | pro |
| `alice@dev.local` | `Alice1234!@#` | architect | pro |
| `bob@dev.local` | `Bob@Dev1234!` | developer | free |

### Spring profiles

Each service has two property files:
- `application.properties` — local dev (Eureka at `localhost:8761`, datasource at `localhost:5432`)
- `application-docker.properties` — Docker overrides (hostnames become container names)

Activate Docker profile: `SPRING_PROFILES_ACTIVE=docker`

In Docker, `ProdDataSeeder` seeds a single admin user configurable via env vars `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

### Frontend data flow

**Wired to real API (gateway on port 8080):**
- `src/api/auth.ts` — login, register → `/auth/**`
- `src/api/profile.ts` — `getMe`, `updateMe` → `/auth/me`
- `src/api/users.ts` — admin CRUD → `/users/**`
- `src/api/roles.ts` — list roles → `/roles/**`
- Auth state persisted in `localStorage` via `AuthContext` (keys: `auth_token`, `auth_user`)

**Still mocked via JSON files in `src/data/`:**
- `projects.json`, `diagrams.json`, `violations.json`, `ai-messages.json`

**Type source of truth:** `src/types/index.ts`
- `AuthUser` — shape stored in localStorage and returned by `/auth/**` (role as `RoleName` string)
- `UserAdmin` — shape returned by `/users/**` (role as full `RoleInfo` object)
- `RoleInfo` — full role object with permissions array

### Frontend routing

```
/login, /register          → public
/dashboard, /projects, /diagrams, /analysis, /ai, /settings  → ProtectedRoute (token required)
/admin/users               → AdminRoute (role === 'admin', redirects to /dashboard otherwise)
```

`AdminRoute` in `src/components/auth/AdminRoute.tsx`. Sidebar shows the **Administration** section only when `user.role === 'admin'`.

### Frontend component layers

- `src/components/layout/` — `Layout` (shell), `Sidebar` (nav + admin section), `Header` (topbar)
- `src/components/auth/` — `ProtectedRoute`, `AdminRoute`
- `src/components/ui/` — `Button`, `Pill`, `Badge`, `Avatar`, `MetricCard`, `StatCard`, `Logo`
- `src/pages/` — one file per route
- `src/pages/admin/` — admin-only pages (`Users.tsx` — full CRUD table)

### project-service (formerly service-metier-1)

Manages projects (CRUD) at `/projects/**`. JWT validation uses the same secret as auth-service. `DevDataSeeder` seeds 8 sample projects on first start (idempotent — skips if table is non-empty).

```
entity/     Project (projects table)
repository/ ProjectRepository
dto/        ProjectDto, CreateProjectRequest, UpdateProjectRequest
service/    ProjectService (CRUD, owner-only update/delete)
controller/ ProjectController (/projects/**)
security/   JwtUtil, JwtAuthFilter, JwtUserDetailsService (stateless — no user DB)
config/     SecurityConfig, DevDataSeeder
```

Authorization: all authenticated users can list/read all projects; update/delete restricted to the project owner (`ownerEmail` == JWT subject).

### user-service

Currently an empty Spring Boot skeleton. Planned for user preferences tied to app features (analysis thresholds, notification settings, activity logs) — things distinct from authentication. Auth CRUD lives in auth-service.

## Critical gotchas

- **`@EnableEurekaServer` is mandatory** on `EurekaServerApplication`. Removing it causes a NullPointerException at startup.
- **Gateway must stay reactive** (`spring.main.web-application-type=reactive`). Never add `spring-boot-starter-web` to the gateway — it conflicts with `spring-boot-starter-webflux`.
- **Spring Initializr dependency IDs**: use `cloud-eureka-server`, `cloud-eureka`, `cloud-gateway` — the older names resolve to wrong/missing artifacts.
- **Node.js version**: Vite 8 requires Node 20.19+ or 22+. The machine currently has 20.12. `npm run build` will fail until Node is upgraded.
- **New Spring Boot services**: each service needs its own `application-docker.properties` with datasource URL pointing to the `postgres` container and `eureka.client.service-url.defaultZone=http://eureka-server:8761/eureka/`.
- **Role migration**: `AppUser.role` is now a FK (`role_id`). With `ddl-auto=update`, the old `role VARCHAR` column is NOT dropped automatically. On a fresh DB this is fine; on an existing dev DB, drop and recreate `auth_db` before first run.
- **Password constraint** (register + admin create): min 12 chars, requires uppercase + lowercase + digit + special char. Regex: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$`
- **Email change logs out the user**: JWT contains the old email. After changing email via `PUT /auth/me`, the current token becomes invalid on the next authenticated request. The user must log in again.

## Frontend design conventions

The UI uses a CSS custom property design system defined in `src/index.css`:

- **Colors**: use `var(--bg-0..4)`, `var(--fg-0..3)`, `var(--accent)` (#5BC0BE teal), `var(--ok/warn/bad/info)`. No hardcoded hex values or Tailwind color utilities.
- **CSS classes**: prefer design system classes (`.btn`, `.card`, `.pill`, `.sidebar`, `.topbar`, `.table`) over inline styles for structural elements.
- **Fonts**: `var(--font-sans)` (Inter) for UI, `var(--font-mono)` (JetBrains Mono) for code, metrics, numeric values.
- **No emojis** in the product UI.
- **Pill vs Badge**: use `<Pill tone="ok|warn|bad|info|neutral">` directly in new code. `<Badge>` is a legacy wrapper.

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

# auth-service test setup: H2 in-memory (create-drop), Eureka disabled
# DevDataSeeder runs in tests (profile !docker) — seeds roles + 3 users
# Integration tests obtain a real JWT by logging in as admin@dev.local
```

When adding a feature, write or update tests in the same PR. The auth-service has both unit tests (`AuthServiceTest` with Mockito) and integration tests (`AuthControllerIntegrationTest`, `UserControllerIntegrationTest` with MockMvc + H2).

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
