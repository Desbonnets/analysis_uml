# UML Analysis

SaaS platform for analyzing software architecture: UML diagram generation, SOLID violation detection, and AI assistance.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 8, React Router 7 |
| Gateway | Spring Cloud Gateway (reactive/WebFlux) — Spring Boot 3.5 |
| Auth | Spring Boot 3.5, Spring Security, JWT (jjwt 0.12), PostgreSQL |
| Discovery | Spring Cloud Netflix Eureka |
| Storage | PostgreSQL 16 + MinIO (S3-compatible) |
| Container | Docker + Docker Compose |

---

## Architecture

```
Browser
 └─ http://localhost:3000 → frontend (React / Nginx in Docker)
       └─ http://localhost:8080 → gateway (Spring Cloud Gateway)
             ├─ /auth/**        → auth-service:8081    (JWT auth, user CRUD)
             ├─ /users/**       → auth-service:8081
             ├─ /roles/**       → auth-service:8081
             ├─ /projects/**    → project-service:8083 (project CRUD, CI tokens)
             ├─ /analysis/**    → analysis-service:8084 (ZIP upload, code parsing)
             └─ /diagrams/**    → diagram-service:8085  (diagram generation)

All services register with Eureka (port 8761).
diagram-service calls analysis-service via Eureka (service-to-service, no gateway hop).

MinIO:9000  — object storage (ZIP uploads + JSON analysis history)
MinIO:9001  — web console (minioadmin / minioadmin in dev)
```

### Service ports

| Service | Port | Database | Notes |
|---|---|---|---|
| frontend | 3000 | — | Nginx in Docker, Vite in dev |
| gateway | 8080 | — | Routes all traffic |
| auth-service | 8081 | auth_db | Login, register, user/role CRUD |
| user-service | 8082 | user_db | Skeleton — not yet implemented |
| project-service | 8083 | projet_db | Project CRUD, CI token integration |
| analysis-service | 8084 | — | ZIP parsing, stores JSON in MinIO |
| diagram-service | 8085 | — | Reads analysis history, generates diagrams |
| eureka-server | 8761 | — | Service discovery |
| postgres | 5432 | — | |
| minio | 9000/9001 | — | Object storage |

---

## Prerequisites

- **Docker Desktop** — for the full stack
- **Java 21** — for running services individually
- **Node.js 20.19+ or 22+** — for the frontend dev server (Vite 8 requirement)
- **Maven Wrapper** (`./mvnw`) — bundled in most service directories

> **Note on mvnw**: `analysis-service` and `diagram-service` have no mvnw committed.
> Copy before first local run:
> ```bash
> cp project-service/mvnw analysis-service/ && cp -r project-service/.mvn analysis-service/
> cp project-service/mvnw diagram-service/  && cp -r project-service/.mvn diagram-service/
> ```

---

## Quick start — Docker (recommended)

```bash
# Build and start everything
docker-compose up --build

# Start only infrastructure (useful when running services locally)
docker-compose up -d postgres minio eureka-server

# Rebuild a single service after a code change
docker-compose up --build -d diagram-service
docker-compose up --build -d analysis-service

# Stop all
docker-compose down

# Stop all and delete volumes (wipes database + MinIO data)
docker-compose down -v
```

The frontend is accessible at **http://localhost:3000**.

---

## Local development (without Docker)

Start services in this order:

```bash
# 1 — Service discovery (must be first)
cd eureka-server    && ./mvnw spring-boot:run   # http://localhost:8761

# 2 — Gateway
cd gateway          && ./mvnw spring-boot:run   # http://localhost:8080

# 3 — Auth service
cd auth-service     && ./mvnw spring-boot:run   # http://localhost:8081

# 4 — Backend services
cd project-service  && ./mvnw spring-boot:run   # http://localhost:8083
cd analysis-service && ./mvnw spring-boot:run   # http://localhost:8084
cd diagram-service  && ./mvnw spring-boot:run   # http://localhost:8085

# 5 — Frontend (requires Node 20.19+ or 22+)
cd frontend && npm install && npm run dev        # http://localhost:3000
```

> MinIO must be running for `analysis-service` and `diagram-service` to start.
> Use `docker-compose up -d minio` to start only MinIO.

---

## Frontend commands

```bash
cd frontend

npm run dev        # Dev server with HMR
npm run build      # TypeScript check + Vite build (requires Node 20.19+)
npm run lint       # ESLint
npm test           # Vitest (watch mode)
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

### Auth Service

| Variable | Default | Description |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/auth_db` | Overridden in Docker |
| `APP_JWT_SECRET` | dev-only base64 key | **Change in production** |
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Docker only |
| `SEED_ADMIN_PASSWORD` | `Admin1234!` | Docker only — **change in production** |

### Analysis Service

| Variable | Default | Description |
|---|---|---|
| `MINIO_ENDPOINT` | `http://localhost:9000` | S3-compatible endpoint |
| `MINIO_ACCESS_KEY` | `minioadmin` | |
| `MINIO_SECRET_KEY` | `minioadmin` | |
| `MINIO_BUCKET` | `analysis-uploads` | Created automatically on startup |

### Frontend (Vite)

| Variable | Dev default | Docker default |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | `/api` |

---

## Fixtures (seed data)

### Dev (local, profile `!docker`)

**Users — deux groupes de projet :**

| Email | Password | Role | Plan | Groupe |
|---|---|---|---|---|
| `admin@dev.local` | `Admin1234!@#` | admin | pro | Projet Alpha |
| `alice@dev.local` | `Alice1234!@#` | architect | pro | Projet Alpha |
| `bob@dev.local` | `Bob@Dev1234!` | developer | free | Projet Alpha |
| `carol@dev.local` | `Carol1234!@#` | admin | pro | Projet Beta |
| `dave@dev.local` | `Dave1234!@#` | architect | pro | Projet Beta |
| `eve@dev.local` | `Eve@Dev1234!` | developer | free | Projet Beta |

**Projets :**

| Nom | Propriétaire | Membres |
|---|---|---|
| Projet Alpha | `admin@dev.local` | admin (owner), alice (member), bob (member) |
| Projet Beta | `carol@dev.local` | carol (owner), dave (member), eve (member) |

Les membres d'un projet voient uniquement leurs propres projets. Les admins voient tous les projets.

### Docker / prod (profile `docker`)

Un admin seedé via les variables d'env `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

---

## Diagrammes UML — flux complet

```
1. Upload ZIP → POST /analysis/{projectId}
   → analysis-service parse le code, stocke le résultat JSON dans MinIO

2. Page "Diagrammes UML" → GET /analysis/{projectId}/history
   → liste l'historique des analyses d'un projet

3. Clic sur une analyse → GET /diagrams/{projectId}/class?recordId={id}
   → diagram-service lit le JSON depuis analysis-service et génère le diagramme

4. 3 onglets disponibles :
   - Classe UML    → GET /diagrams/{projectId}/class
   - Dépendances   → GET /diagrams/{projectId}/dependencies
   - Packages      → GET /diagrams/{projectId}/packages
   + Métriques     → GET /diagrams/{projectId}/metrics (évolution temporelle)
```

---

## Filtrage des fichiers analysés

### Exclusions intégrées

Certains chemins sont toujours ignorés, quelle que soit la configuration :

| Chemin | Raison |
|--------|--------|
| `node_modules/` | Dépendances npm/yarn |
| `/.git/` | Métadonnées Git |
| `/target/` | Artefacts de build Maven |
| `/__pycache__/` | Bytecode Python |

Seuls les fichiers avec les extensions suivantes sont analysés : `.java`, `.js`, `.mjs`, `.ts`, `.tsx`, `.py`, `.php`, `.c`, `.h`, `.cpp`, `.cc`, `.cxx`, `.hpp`. Les fichiers dépassant **10 Mo** sont ignorés individuellement.

### Fichier de configuration personnalisé

Créez un fichier `analysis.yml` (ou `analysis.yaml` / `analysis.json`) à la racine de votre ZIP. Deux modes sont disponibles, utilisables séparément ou ensemble :

**`exclude` — liste noire** : ignore les chemins correspondants, analyse tout le reste.

```yaml
exclude:
  - vendor/
  - dist/
  - build/
  - coverage/
  - tests/fixtures/
```

**`include` — liste blanche** : n'analyse que les chemins correspondants, ignore tout le reste.

```yaml
include:
  - src/
  - lib/
```

**Combinaison** : `include` restreint d'abord le périmètre, puis `exclude` retire des entrées de ce périmètre.

```yaml
include:
  - src/
exclude:
  - src/generated/
```

Équivalent JSON :

```json
{
  "include": ["src/"],
  "exclude": ["src/generated/"]
}
```

Structure du ZIP attendue :

```
monprojet.zip
├── analysis.yml        ← lu en premier, avant extraction
├── src/
│   └── ...
└── vendor/             ← ignoré si "vendor/" est dans exclude
```

Chaque pattern est appliqué via une correspondance de sous-chaîne sur le chemin complet de l'entrée ZIP — `vendor/` exclut `monprojet/vendor/autoload.php` aussi bien que `vendor/lib/foo.php`. Si le fichier de config est absent ou invalide, les exclusions intégrées s'appliquent normalement (avertissement loggué).

---

## Database

PostgreSQL 16 with three databases created via `init-db.sql`:

```sql
CREATE DATABASE auth_db;    -- auth-service
CREATE DATABASE user_db;    -- user-service (future)
CREATE DATABASE projet_db;  -- project-service
```

`analysis-service` and `diagram-service` are stateless — they use MinIO for persistence, not PostgreSQL.

JPA DDL mode is `update` in all services — schema managed automatically in dev.

---

## Membership et visibilité des projets

La visibilité des projets est contrôlée par la table `project_members` dans `projet_db`.

| Rôle système | Visibilité projets |
|---|---|
| `admin` | Tous les projets |
| `architect` / `developer` | Uniquement les projets dont ils sont membres |

### Endpoints membres

```
GET    /projects/{id}/members              — liste les membres (accessible aux membres et admins)
POST   /projects/{id}/members              — ajoute un membre (owner uniquement)
DELETE /projects/{id}/members/{email}      — retire un membre (owner uniquement)
```

Payload `POST /projects/{id}/members` :
```json
{ "userEmail": "user@example.com", "userName": "Prénom Nom" }
```

### Rôles de membership

| Rôle | Description |
|---|---|
| `owner` | Créateur du projet — peut modifier, supprimer, gérer les membres |
| `member` | Membre invité — peut consulter et analyser |

---

## Sécurité frontend

- **JWT stocké en `localStorage`** — vulnérable XSS ; migration vers cookie `httpOnly` prévue en production.
- **Auto-logout sur 401** — toute réponse 401 du backend dispatch un event `auth:unauthorized` sur `window`, ce qui déclenche `clearAuth()` et redirige vers `/login`.
- **Sync inter-onglets** — déconnexion dans un onglet propagée aux autres via l'event `storage` sur `TOKEN_KEY`.
- **Retry automatique** — les erreurs 502/503/504 (services Docker pas encore démarrés) sont retentées 2 fois avec 1 s de délai avant d'afficher une erreur.
- **Cache-Control: no-cache** — ajouté sur toutes les requêtes API pour éviter les réponses en cache périmées après redémarrage Docker.

---

## Known issues / gotchas

- **`@EnableEurekaServer` is mandatory** on `EurekaServerApplication`. Removing it causes a NullPointerException at startup.
- **Gateway must stay reactive** (`spring-cloud-starter-gateway` / WebFlux). Never add `spring-boot-starter-web` to the gateway.
- **Node version**: Vite 8 requires Node 20.19+ or 22+. `npm run dev` and `npm run build` will fail on older versions.
- **MinIO must start before analysis-service and diagram-service** — both fail on startup if MinIO is unreachable.
- **diagram-service calls analysis-service** using `@LoadBalanced RestTemplate` — Eureka must be running first.
- **JWT secret**: dev-only placeholder in `application.properties`. Replace before any production deployment.
- **project_members table**: créée automatiquement par JPA (`ddl-auto=update`). Sur une base existante, la table sera ajoutée sans perte de données. Les projets existants sans membres ne seront pas visibles pour les non-admins tant qu'un owner n'est pas assigné manuellement.

---

## Git workflow

```bash
git checkout -b feature/my-feature   # never commit directly to main
git add specific-file.ts             # never git add -A
git commit -m "feat(scope): message" # conventional commits
git push -u origin feature/my-feature
gh pr create
```

Commit types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
