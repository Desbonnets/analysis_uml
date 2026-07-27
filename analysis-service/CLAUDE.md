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
