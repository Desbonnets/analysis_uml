# diagram-service (port 8085)

Stateless service — no database. Reads analysis history from analysis-service via Eureka (RestTemplate `@LoadBalanced`), transforms CodeUnit/ClassDef data into diagram formats, and returns them to the frontend on demand.

```
controller/ DiagramController  (GET /diagrams/{projectId}/{class|dependencies|packages|metrics})
service/    ClassDiagramService     (superClass→EXTENDS, interfaces→IMPLEMENTS, deps→USES interne)
            DependencyGraphService  (tous les deps sans filtre)
            PackageDiagramService   (grouper par packageName, arêtes inter-packages)
            MetricsService          (agrège AnalysisHistoryEntry — pas de fetch N+1)
client/     AnalysisClient          (forwarde le JWT de l'utilisateur vers analysis-service)
model/      miroir des modèles analysis-service pour désérialisation JSON
dto/        ClassDiagramDto, DependencyGraphDto, PackageDiagramDto, MetricsDto
config/     SecurityConfig, RestClientConfig (@LoadBalanced RestTemplate)
security/   JwtUtil, JwtAuthFilter, JwtUserDetailsService (même pattern)
```

**Endpoints:**
```
GET /diagrams/{projectId}/class?recordId={id}        → ClassDiagramDto (nodes + edges)
GET /diagrams/{projectId}/dependencies?recordId={id} → DependencyGraphDto
GET /diagrams/{projectId}/packages?recordId={id}     → PackageDiagramDto
GET /diagrams/{projectId}/metrics                    → MetricsDto (évolution temporelle)
```

- `recordId` absent → utilise l'analyse la plus récente (1er de l'historique)
- Tous les endpoints requirent authentification JWT
- Le JWT de l'utilisateur est forwardé dans les appels vers analysis-service

**Dockerfile** uses the Maven base image (`maven:3.9-eclipse-temurin-21-alpine`) — no mvnw needed for Docker builds.

**No mvnw**: copy from project-service before running locally:
`cp project-service/mvnw diagram-service/ && cp -r project-service/.mvn diagram-service/`

## Class diagram filters

`GET /diagrams/{projectId}/class` accepts three independent, combinable query params (all applied server-side, before the response is serialized — matters for large projects):
- `filter=entities` — keeps only classes flagged as DB entities via `ClassDef.entity` (set in the language parser). Detected today for:
  - PHP: `#[ORM\Entity]` / `@ORM\Entity` (Doctrine) — `PhpLanguageParser`
  - Java: `@Entity` (JPA, `javax.persistence` or `jakarta.persistence`) — `JavaLanguageParser`, via the ANTLR `annotation` rule on class modifiers
  - Python: superclass named `Model`/`db.Model` (Django, Flask-SQLAlchemy) or `Base`/`DeclarativeBase` (SQLAlchemy declarative) — `PythonLanguageParser`, heuristic on the base-class list
  - Not yet detected: JS/TS (TypeORM `@Entity()`, Sequelize), C/C++ (no common ORM)
- `types=class,interface,enum,abstract_class` (comma-separated, case-insensitive) — keeps only matching `ClassDef.type` values
- `packageContains=<substring>` — keeps only classes whose package name contains the substring (case-insensitive)

Frontend: `frontend/CLAUDE.md` — exposed as toggle buttons + a package text filter on the Classe UML tab of `DiagramEditor`.
