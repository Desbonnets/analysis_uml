# analysis-service (port 8084)

Stateless service — no database. Receives ZIP uploads, stores them in MinIO, orchestrates code analysis (per-language parsers) and returns parsed `CodeUnit`/`ClassDef` data.

```
controller/ AnalysisController  (POST /analysis/{projectId} — multipart, JWT required)
service/    AnalysisService     (validates file: ZIP only, max 50 MB)
            StorageService      (uploads to MinIO, auto-creates bucket on startup)
config/     MinioConfig         (MinioClient bean, configured via env vars)
            SecurityConfig
security/   JwtUtil, JwtAuthFilter, JwtUserDetailsService (stateless — same pattern as project-service)
```

**MinIO configuration (env vars):**
```
MINIO_ENDPOINT   — http://localhost:9000 (dev) | https://s3.gra.cloud.ovh.net (OVH prod)
MINIO_ACCESS_KEY
MINIO_SECRET_KEY
MINIO_BUCKET     — analysis-uploads (default)
```

**Storage key format:** `projects/{projectId}/{timestamp}-source.zip`

ZIP files are kept after analysis to allow re-runs without re-upload.

**Dockerfile** uses the Maven base image (`maven:3.9-eclipse-temurin-21-alpine`) — no mvnw needed for Docker builds.

See `docs/file-filtering.md` for the ZIP extraction/filtering pipeline (analysis.yml config, built-in exclusions, per-file size limit).

## Parser coverage per language

Every parser emits `ClassDef` (feeds the class/dependency diagrams) inside a `CodeUnit` (feeds the package diagram via `packageName`). Coverage is uneven — use this table to know what a diagram for a given language can and can't show today.

| Language | Parser | Strategy | Constructs → `ClassType` | Inheritance | Members | `entity` flag | `packageName` |
|---|---|---|---|---|---|---|---|
| Java | `JavaLanguageParser` | ANTLR grammar | class, `abstract class`→ABSTRACT_CLASS, interface, enum, record, annotation | extends + implements (multi) | full, with real types/visibility/static/abstract | `@Entity` (JPA, javax/jakarta) | package declaration |
| PHP | `PhpLanguageParser` | regex | class, interface, trait→CLASS, enum (incl. backed/implements) | extends + implements | methods typed via signature; **field types always `"mixed"`** (regex can't resolve PHP property types reliably) | Doctrine `#[ORM\Entity]` / `@ORM\Entity` | `namespace` declaration |
| Python | `PythonLanguageParser` | regex + indentation | class, class extending `Enum`/`IntEnum`/`StrEnum`/`Flag`/`IntFlag`→ENUM | single base→superClass, rest→interfaces (no real multiple-inheritance semantics) | methods/fields from type hints + `self.x` in `__init__` | Django `Model`/SQLAlchemy `Base`/`DeclarativeBase` base-name heuristic | **not set** — every file collapses into one `(default)` package node |
| TypeScript | `TypeScriptLanguageParser` (`JsRegexParser`) | regex | class, `abstract class`→still CLASS (modifier not read), interface, enum | extends + implements | methods/fields with type annotations | not detected (TypeORM `@Entity()` not handled) | **not set** |
| JavaScript | `JavaScriptLanguageParser` (`JsRegexParser`) | regex | class only (no interface/enum keyword in JS) | extends only | methods/fields untyped (`any`/`void`) | not detected | **not set** |
| C | `CLanguageParser` | regex | `struct`/`typedef struct`→CLASS, `enum`/`typedef enum`→ENUM | none (C has no inheritance) | fields only (no member functions); `union` not detected at all | n/a | **not set** |
| C++ | `CppLanguageParser` | regex | `class`/`struct`→CLASS (indistinguishable), `enum`/`enum class`/`enum struct`→ENUM | single/multiple base classes (access specifier discarded) | methods/fields, per-section visibility tracked | n/a | first `namespace` block only (nested/multiple namespaces not merged) |

**Practical impact on diagrams:**
- **Class diagram** (`filter=entities`, `types=`, `packageContains=`): reliable everywhere except the `abstract_class` type filter, which only ever populates from Java, and `filter=entities`, which is empty for JS/TS/C/C++ projects (no ORM convention detected).
- **Package diagram**: only meaningful for Java, PHP, and (single-namespace) C++. Python/TS/JS/C projects render as one `(default)` package containing everything — not a real limitation of the diagram, a gap in the parsers not capturing module/directory structure.
- **Dependency graph**: driven by `ClassDef.dependencies`, which is only as accurate as each parser's type extraction (weakest for PHP fields and untyped JS).

## Test detection (`MethodDef.isTest` / `storyId`)

Used by diagram-service's test-coverage check (see `diagram-service/CLAUDE.md`) to link detected
tests to a user-supplied requirements backlog. Detected today for Java and PHP only — Python/JS/TS/C/C++
are not covered yet (extend `PythonLanguageParser`/`JsRegexParser` the same way if needed later):

| Language | `isTest` when... | `storyId` from... |
|---|---|---|
| Java | `@Test` (JUnit 4 `org.junit.Test` or JUnit 5 `org.junit.jupiter.api.Test`), any import form | `@Tag("US-67")` / `@Tag(value = "US-67")` (JUnit 5) |
| PHP | method named `test*`, or docblock `@test`, inside a class `extends TestCase` | docblock `@group US-67` |

`storyId` is free text — the test-coverage matcher (diagram-service) extracts digits from it and
compares against a requirement's numeric ID, so `US-67`, `67`, or `#67` are all equivalent.
