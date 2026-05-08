# UML Analysis

SaaS platform for analyzing software architecture: UML diagram visualization, SOLID violation detection, and AI assistance.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7 |
| Gateway | Spring Cloud Gateway (reactive/WebFlux) — Spring Boot 3.5 |
| Auth | Spring Boot 3.5, Spring Security, JWT (jjwt 0.12), PostgreSQL |
| Discovery | Spring Cloud Netflix Eureka |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |

---

## Architecture

```
Browser
 ├─ http://localhost:3000          → frontend (React / Nginx in Docker)
 │    └─ /api/** (Docker only)     → proxied by Nginx to gateway:8080
 └─ http://localhost:8080          → gateway (direct in dev)
       ├─ /auth/**                 → auth-service:8081
       ├─ /users/**                → user-service:8082 (coming soon)
       └─ /metier/**               → service-metier-1:8083 (coming soon)

All services register with Eureka (port 8761).
Gateway routes by service name via Eureka, not hardcoded URLs.
```

### Service ports

| Service | Port | Database |
|---|---|---|
| frontend | 3000 | — |
| gateway | 8080 | — |
| auth-service | 8081 | auth_db |
| user-service | 8082 | user_db |
| service-metier-1 | 8083 | metier1_db |
| eureka-server | 8761 | — |
| postgres | 5432 | — |

---

## Prerequisites

- **Docker Desktop** — for the full stack
- **Java 21** — for running services individually
- **Node.js 20.19+ or 22+** — for the frontend dev server (Vite 8 requirement)
- **Maven Wrapper** (`./mvnw`) — bundled in each service directory

---

## Quick start — Docker (recommended)

```bash
# Build and start everything
docker-compose up --build

# Start only infrastructure (postgres + eureka), useful when running services locally
docker-compose up -d postgres eureka-server

# Rebuild a single service after a code change
docker-compose up --build -d gateway
docker-compose up --build -d auth-service

# Stop all
docker-compose down

# Stop all and delete volumes (wipes the database)
docker-compose down -v
```

The frontend is accessible at **http://localhost:3000**.

---

## Local development (without Docker)

Start services in this order:

```bash
# 1 — Service discovery (must be first)
cd eureka-server && ./mvnw spring-boot:run        # http://localhost:8761

# 2 — Gateway
cd gateway && ./mvnw spring-boot:run              # http://localhost:8080

# 3 — Auth service
cd auth-service && ./mvnw spring-boot:run         # http://localhost:8081

# 4 — Other services (optional)
cd user-service && ./mvnw spring-boot:run         # http://localhost:8082
cd service-metier-1 && ./mvnw spring-boot:run     # http://localhost:8083

# 5 — Frontend (requires Node 20.19+ or 22+)
cd frontend && npm install && npm run dev         # http://localhost:3000
```

> **Note:** `npm run build` also requires Node 20.19+. The current machine has 20.12 — upgrade Node before building for production.

---

## Frontend commands

```bash
cd frontend

npm run dev        # Dev server with HMR
npm run build      # TypeScript check + Vite build (requires Node 20.19+)
npm run lint       # ESLint
npm run test       # Vitest (watch mode)
npm run test:run   # Vitest (single run, CI)
npx tsc --noEmit   # Type check only
```

---

## Backend commands (per service)

```bash
cd <service-directory>

./mvnw spring-boot:run           # Start service
./mvnw test                      # Run all tests
./mvnw test -Dtest=MyTestClass   # Run a single test class
./mvnw package -DskipTests       # Build JAR without running tests
```

---

## Environment variables

### Gateway

| Variable | Default | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | — | Set to `docker` inside containers |
| `CORS_ALLOWED_ORIGIN` | `http://localhost:3000` | Browser origin allowed by the CORS filter |

### Auth Service

| Variable | Default | Description |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | — | Set to `docker` inside containers |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/auth_db` | Overridden in Docker |
| `SPRING_DATASOURCE_USERNAME` | `admin` | |
| `SPRING_DATASOURCE_PASSWORD` | `admin` | |
| `APP_JWT_SECRET` | dev-only base64 key | **Change in production** |
| `APP_JWT_EXPIRATION_MS` | `86400000` (24 h) | JWT lifetime |

### Frontend (Vite)

| Variable | Dev default | Docker/prod default |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | `/api` |

In dev (`npm run dev`), the frontend calls the gateway directly.  
In Docker, Nginx proxies `/api/**` to `gateway:8080` internally — no cross-origin request from the browser.

---

## Auth API

All endpoints are exposed at `http://localhost:8080/auth/**` (through the gateway).

### Register

```
POST /auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123",   // min 8 characters
  "role": "USER"             // optional, defaults to USER
}
```

**Response 201**
```json
{
  "token": "<JWT>",
  "user": { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "USER", "plan": "FREE" }
}
```

### Login

```
POST /auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response 200** — same shape as register.

### Authenticated requests

Pass the token as a Bearer header:

```
Authorization: Bearer <JWT>
```

---

## CORS

CORS is handled exclusively at the **gateway** level via `GatewayCorsConfig`.  
Downstream services (auth-service, etc.) must **not** add their own CORS configuration.

| Environment | Allowed origin | How |
|---|---|---|
| Dev (local) | `http://localhost:3000` | `application.properties` |
| Docker | `${CORS_ALLOWED_ORIGIN:http://localhost:3000}` | `application-docker.properties` |
| Prod | Pass `CORS_ALLOWED_ORIGIN=https://app.yourdomain.com` | Docker env var |

---

## Spring profiles

Each service has two property files:

- `application.properties` — local dev (Eureka at `localhost:8761`, datasource at `localhost:5432`)
- `application-docker.properties` — Docker overrides (hostnames become container names)

Activate the Docker profile: `SPRING_PROFILES_ACTIVE=docker` (set automatically in `docker-compose.yml`).

---

## Database

PostgreSQL 16 with three databases created automatically on first run via `init-db.sql`:

```sql
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
CREATE DATABASE metier1_db;
```

JPA DDL mode is `update` in all services — schema is managed automatically during development.  
Add Flyway or Liquibase migrations before any production-facing feature.

---

## Known issues / gotchas

- **`@EnableEurekaServer` is mandatory** on `EurekaServerApplication`. Removing it causes a NullPointerException at startup.
- **Gateway must stay reactive** (`spring-cloud-starter-gateway` / WebFlux). Never add `spring-boot-starter-web` to the gateway — it conflicts with WebFlux.
- **Node version**: Vite 8 requires Node 20.19+ or 22+. `npm run dev` and `npm run build` will fail on older versions.
- **JWT secret**: the current `app.jwt.secret` in `application.properties` is a dev-only placeholder. Replace it with a strong secret before any production deployment.

---

## Git workflow

```bash
git checkout -b feature/my-feature   # never commit directly to main
# ... changes ...
git add specific-file.ts             # never git add -A
git commit -m "feat(scope): message" # conventional commits
git push -u origin feature/my-feature
gh pr create
```

Commit types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
