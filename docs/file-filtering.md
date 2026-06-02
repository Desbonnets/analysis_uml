# File Filtering in analysis-service

Documentation for the filtering pipeline that decides which files inside a ZIP are extracted, parsed, and included in the analysis result.

## Pipeline overview

```
ZIP upload
    │
    ▼
ZipExtractorService.extractSourceFiles()
    ├── Skip directories
    ├── Skip excluded paths  (node_modules, .git, /target/, __pycache__)
    ├── Skip unsupported extensions  (not in SUPPORTED whitelist)
    └── Skip oversized files  (> 10 MB per entry)
    │
    ▼
Map<filename, bytes>  (source files only)
    │
    ▼
AnalysisService.analyzeZip()
    ├── Group files by Language via ParserFactory.detectLanguage()
    └── Remove Language.UNKNOWN group
    │
    ▼
Per-language parsers
    └── Filter primitive types / language keywords from dependency lists
```

---

## ZipExtractorService

**File:** `analysis-service/src/main/java/com/example/analysisservice/service/ZipExtractorService.java`

This is the entry point of the filter chain. It reads the ZIP stream entry by entry and applies three independent guards before keeping a file.

### 0. User config (analysis.yml)

Before extracting files, a first pass reads `analysis.yml` / `analysis.yaml` / `analysis.json` from anywhere in the ZIP. The parsed config drives two optional filters applied after the built-in guards:

| Field | Type | Behaviour |
|-------|------|-----------|
| `include` | `List<String>` | **Whitelist** — only files whose path contains at least one pattern are kept. If the list is empty, all files pass. |
| `exclude` | `List<String>` | **Blacklist** — files whose path contains any pattern are dropped. |

When both are present, `include` is evaluated first, then `exclude` on the remaining set.

```yaml
# analysis.yml — place at the root of the ZIP
include:
  - src/
exclude:
  - src/generated/
```

```json
// analysis.json
{
  "include": ["src/"],
  "exclude": ["src/generated/"]
}
```

### 1. Supported extension whitelist

```java
private static final Set<String> SUPPORTED = Set.of(
    "java", "js", "mjs", "ts", "tsx", "py", "php",
    "c", "h", "cpp", "cc", "cxx", "hpp"
);
```

Only files whose extension (case-insensitive, after the last `.`) is in this set are kept. Files with no extension are always rejected.

| Language | Accepted extensions |
|----------|-------------------|
| Java | `.java` |
| JavaScript | `.js`, `.mjs` |
| TypeScript | `.ts`, `.tsx` |
| Python | `.py` |
| PHP | `.php` |
| C | `.c`, `.h` |
| C++ | `.cpp`, `.cc`, `.cxx`, `.hpp` |

> **Note:** `.cjs` is accepted by `Language.fromExtension()` but is not in the `SUPPORTED` set — CommonJS modules are silently dropped at the extraction stage.

### 2. Path exclusion blacklist

The following path fragments cause a file to be skipped regardless of its extension:

| Pattern | Reason |
|---------|--------|
| `node_modules/` | npm/yarn dependency trees |
| `/.git/` | Git repository internals |
| `/target/` | Maven build output |
| `/__pycache__/` | Python bytecode cache |

The check uses `String.contains()` on the full ZIP entry path, so it catches nested occurrences (e.g. `libs/node_modules/lodash/index.js`).

### 3. Per-file size limit

```java
private static final int MAX_ENTRY_BYTES = 10 * 1024 * 1024; // 10 MB
```

Files are read byte-by-byte into memory. If the running total exceeds 10 MB before EOF, reading stops, a warning is logged, and `null` is returned — the file is excluded. This protects against ZIP bomb payloads and very large generated files.

---

## Language detection — Language.java

**File:** `analysis-service/src/main/java/com/example/analysisservice/model/Language.java`

After extraction, each file path is mapped to a `Language` enum value via `Language.fromExtension()`. Extensions not in the mapping return `Language.UNKNOWN`.

---

## AnalysisService — second-pass filter

**File:** `analysis-service/src/main/java/com/example/analysisservice/service/AnalysisService.java`

After `ZipExtractorService` returns the source file map, `analyzeZip()` groups files by detected language and immediately drops the `UNKNOWN` group:

```java
byLanguage.remove(Language.UNKNOWN);
```

Languages that have no registered parser (i.e. `ParserFactory.getParser()` returns `Optional.empty()`) are added to the `unsupportedLanguages` list in the response but produce no `CodeUnit` output.

---

## Parser-level filtering (dependency lists)

Each language parser filters out primitive types and language keywords when building the dependency list of a class/function. These are not part of `ZipExtractorService` but are part of the filtering pipeline that determines what appears in the final analysis.

| Parser | Filtered tokens |
|--------|----------------|
| Java | `int`, `String`, `Object`, `List`, `void`, self-references, blanks |
| C++ | C++ primitives and keywords |
| Python | `None`, `Any`, self-references |
| PHP | `void`, `mixed`, self-references |
| C | C primitives, self-references |
| JS/TS | `string`, `number`, `boolean`, `void`, `any`, self-references |

---

## Upload-level validation

Before the ZIP even reaches `ZipExtractorService`, `AnalysisService.validateFile()` enforces:

- File must not be null or empty.
- Content-type must be `application/zip` or `application/x-zip-compressed`.
- Total ZIP size must not exceed `analysis.upload.max-size-mb` (default **200 MB**, configurable in `application.properties`).

These checks reject the entire request early — no extraction occurs.

---

## Modifying filters

### Add a built-in excluded directory

In `ZipExtractorService.isSupported()`, add a `|| filename.contains("/your-dir/")` clause to the built-in path check block.

### Add include/exclude patterns at runtime

Users declare them in `analysis.yml` inside their ZIP — no code change needed.

### Exclude a new file extension

Remove the extension from the `SUPPORTED` set. If the extension was previously mapped in `Language.fromExtension()`, also remove that branch to keep them in sync.

### Change the per-file size limit

Update `MAX_ENTRY_BYTES` in `ZipExtractorService`. The warning message in `readSafely()` reads the constant at runtime, so no other change is needed.

### Change the total upload size limit

Update `analysis.upload.max-size-mb` in `application.properties` and keep `spring.servlet.multipart.max-file-size` / `max-request-size` at least as large.
