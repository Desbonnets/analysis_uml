# project-service (formerly service-metier-1)

Manages projects (CRUD) at `/projects/**`. JWT validation uses the same secret as auth-service. `DevDataSeeder` seeds 8 sample projects on first start (idempotent — skips if table is non-empty).

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

Authorization: all authenticated users can list/read all projects; update/delete restricted to the project owner (`ownerEmail` == JWT subject).

**CI integration endpoints:**
- `POST /projects/{id}/token` — generate/regenerate API token (JWT auth, owner only)
- `POST /projects/{id}/report` — receive CI analysis report (no JWT, `X-Project-Token` header)
