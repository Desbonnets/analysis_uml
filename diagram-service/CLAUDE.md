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

## PlantUML export

Each code-derived diagram has an `/export` sibling endpoint returning `PlantUmlExportDto { recordId, source }` (PlantUML text, not rendered):
```
GET /diagrams/{projectId}/class/export?recordId=&filter=&types=&packageContains=
GET /diagrams/{projectId}/dependencies/export?recordId=
GET /diagrams/{projectId}/packages/export?recordId=
```
`class/export` accepts the same three filters as `GET /diagrams/{projectId}/class` (applied before conversion). `PlantUmlExporter` (in `plantuml/`, mirrors `PlantUmlParser`) does the DTO→text conversion; `PlantUmlExportService` wires it to `ClassDiagramService`/`DependencyGraphService`/`PackageDiagramService`. Output only uses syntax `PlantUmlParser` understands (plus association cardinality labels it ignores), so an exported class diagram can be re-imported as a conformance reference diagram.

Frontend: the "Exporter" button in `DiagramEditor`'s toolbar (Classe UML / Dépendances / Packages tabs) downloads the result as a `.puml` file client-side (`Blob` + object URL).
`POST /diagrams/{projectId}/conformance` accepts the same three query params (`filter`, `types`, `packageContains`), applied to the **actual** side of the comparison before it's diffed against the reference PlantUML — e.g. `filter=entities` checks only DB entity classes against the reference, so non-entity classes in the codebase are neither reported missing nor flagged as extra. `ConformanceService.generate(...)` forwards them straight to `ClassDiagramService.generate(...)`.

**Configurable precision**: two more query params, `checkFields` and `checkMethods` (booleans, default `false`), opt in to diffing class members instead of just presence/type/relations. `PlantUmlParser` now parses class-body content (`{ ... }`, same-line brace only) into `FieldDecl`/`MethodDecl`; `ConformanceService` diffs those against the actual side's already-formatted `DiagramNode.fields`/`methods` strings (same `"+ name: Type"` / `"+ name(Type1, Type2): Return"` convention on both sides, reused via `PlantUmlParser#parseField`/`parseMethod`). New violation types: `FIELD_MISSING`/`FIELD_TYPE_MISMATCH`/`EXTRA_FIELD`, `METHOD_MISSING`/`METHOD_SIGNATURE_MISMATCH`/`EXTRA_METHOD`. A reference class written without a body (`class Foo` with no `{ }`) is exempt from member checks even when the flags are on — no body means "members unspecified", not "must have none". `checkExceptions` is **not implemented** — blocked on `analysis-service` not capturing `throws` yet, see `docs/conformance-precision.md`.

## Test coverage vs requirements

```
POST /diagrams/{projectId}/test-coverage?recordId=
  body: { requirements: "1. Titre — description\n2. ..." }
  → TestCoverageReportDto
```

Same "user supplies a reference, platform diffs it against the analyzed code" shape as
`ConformanceService`, applied to tests instead of the class diagram:
- `RequirementsParser` (`requirements/`) parses the pasted/imported backlog — one requirement per
  line, `"N. **Title** — description"` (bold and the `—`/`-` separator both optional; a leading
  status marker like the emoji used in this repo's own `USER_STORIES.md` is stripped). Lines not
  matching `N. ...` are skipped.
- `TestCoverageService` fetches the full `AnalysisRecord` (not the flattened `ClassDiagramDto` —
  it needs `MethodDef.isTest`/`storyId` per method, not the pre-formatted diagram strings) and
  matches each detected test against the parsed requirements, ID mode first:
  1. **ID mode**: digits extracted from the test's `storyId` match a requirement's numeric ID →
     `CONFIRMED`.
  2. **Keyword mode** (only for tests with no ID match): overlap between the test method name's
     words and the requirement's title+description words, against a minimum-shared-keywords
     threshold → `HEURISTIC` on the best-scoring requirement; below threshold, the test isn't
     linked to any requirement. Thresholds are a starting point, not tuned against a real backlog
     — see `docs/test-coverage-analysis.md`.
- A requirement's `status` is `COVERED_CONFIRMED` / `COVERED_HEURISTIC` / `UNCOVERED` — confirmed
  wins if a requirement has both kinds of match.

**Scope**: this proves a test exists and claims to cover a requirement, not that it tests the
right behavior — a traceability aid, not a quality guarantee. Test detection today only covers
Java (`@Test` + `@Tag`) and PHP (`test*`/`@test` in a `TestCase` subclass + `@group`) — see
`analysis-service/CLAUDE.md`, "Test detection".

Frontend: dedicated "Couverture des tests" page (`/test-coverage`, sidebar entry), not a
`DiagramEditor` tab — same paste/import-then-verify UX as the Conformité page (`/conformance`,
also its own dedicated page, not a tab), each with its own project/analysis selector. No
saved-backlog reuse yet, unlike `SavedUmlDiagram` for PlantUML references.
