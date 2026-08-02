# project-service (formerly service-metier-1)

Manages projects (CRUD) at `/projects/**`. JWT validation uses the same secret as auth-service. `DevDataSeeder` seeds 4 sample projects (2 groups × 2 projects, different owners per project) on first start (idempotent — skips if table is non-empty).

```
entity/     Project (projects table — includes repositoryUrl, apiToken)
repository/ ProjectRepository
dto/        ProjectDto, CreateProjectRequest, UpdateProjectRequest
            GenerateTokenResponse, SubmitAnalysisRequest
service/    ProjectService (CRUD, owner-only update/delete, token generation, analysis report)
controller/ ProjectController (/projects/**)
security/   JwtUtil, JwtAuthFilter, JwtUserDetailsService (stateless — no user DB)
config/     SecurityConfig, DevDataSeeder
```

Authorization: strictly membership-based, no admin bypass — a user (including `ROLE_ADMIN`) only sees/lists projects they are a member of (`ProjectMember`, checked via `ProjectRepository.findByMemberEmail` / `ProjectMemberRepository.existsByProjectIdAndUserEmail`); update/delete/token/member-management are further restricted to the project owner (`ownerEmail` == JWT subject).

**`Project.languages`**: a project can have multiple languages/frameworks (`@ElementCollection`, `project_languages` join table) — no longer a single `language` string. On an existing dev DB with `ddl-auto=update`, the old `language` column is not dropped and the new join table starts empty; drop/recreate `projet_db` (or manually migrate) before relying on seeded/existing project data.

**`Project.logoUrl`**: optional project avatar, stored as a client-resized base64 `data:` URL in a `TEXT` column (no MinIO/file-storage dependency added to this service). Frontend resizes to a 256×256 JPEG before sending — keep payloads small if calling `PUT /projects/{id}` directly.

**CI integration endpoints:**
- `POST /projects/{id}/token` — generate/regenerate API token (JWT auth, owner only)
- `POST /projects/{id}/report` — receive CI analysis report (no JWT, `X-Project-Token` header)
