# Architecture — Analyse de code et diagrammes UML

## Vue d'ensemble

```
Browser → frontend → gateway:8080
                       ├── project-service:8083   (PostgreSQL — projets + violations)
                       ├── analysis-service:8084  (orchestrateur — parse ZIP)
                       └── diagram-service:8085   (MongoDB — diagrammes UML)
```

Flux d'une analyse :

```
1. Utilisateur upload un ZIP → analysis-service
2. analysis-service parse le code (JavaParser)
3.   → POST /projects/{id}/violations  (project-service)
4.   → PUT  /projects/{id}             (project-service — score + status)
5.   → POST /diagrams                  (diagram-service)
```

---

## Services

### project-service (existant — port 8083) — PostgreSQL `projet_db`

Ajouts :

**Table `violations`**
| Colonne | Type | Description |
|---|---|---|
| id | BIGINT PK | |
| project_id | BIGINT FK | Référence vers `projects` |
| principle | VARCHAR | `SRP`, `OCP`, `LSP`, `ISP`, `DIP` |
| severity | VARCHAR | `critical`, `high`, `medium`, `low` |
| title | VARCHAR | Titre court de la violation |
| description | TEXT | Explication détaillée |
| file | VARCHAR | Chemin du fichier concerné |
| line | INT | Numéro de ligne |
| created_at | TIMESTAMP | |

**Nouveaux endpoints**
```
POST /projects/{id}/violations   → enregistre les violations d'une analyse
GET  /projects/{id}/violations   → liste les violations du projet
DELETE /projects/{id}/violations → purge avant une nouvelle analyse
```

---

### analysis-service (nouveau — port 8084)

Rôle : orchestrateur. Reçoit le ZIP, parse le code, appelle les deux autres services.

**Librairie :** [JavaParser](https://javaparser.org/) pour l'AST Java.

**Endpoint**
```
POST /analysis/{projectId}   multipart/form-data  (JWT requis, owner seulement)
```

**Ce qui est détecté**

| Principe | Heuristique |
|---|---|
| SRP | Classe avec >10 méthodes publiques ET >5 dépendances injectées |
| ISP | Interface avec >7 méthodes |
| DIP | `new ConcreteClass()` dans une classe de haut niveau (hors entités/DTOs) |
| OCP | `switch`/`instanceof` sur des types métier |
| LSP | Méthode override levant des exceptions non déclarées dans le parent |

**Calcul du score**
```
score = max(0, 100 - Σ(violations × poids))
poids : critical=10  high=5  medium=2  low=1
```

**Appels sortants (HTTP via Eureka)**
- `DELETE /projects/{id}/violations` → purge les anciennes violations
- `POST   /projects/{id}/violations` → sauvegarde les nouvelles
- `PUT    /projects/{id}`            → met à jour score + status (`analyzed` ou `error`)
- `POST   /diagrams`                 → envoie les données de diagramme

**Pas de base de données propre** — ce service est sans état, il ne stocke rien.

---

### diagram-service (nouveau — port 8085) — MongoDB `diagrams_db`

Rôle : stocker et servir les diagrammes de classes générés à partir du code source.

**Collection `diagrams`**
```json
{
  "_id": "ObjectId",
  "projectId": 1,
  "type": "class",
  "name": "Diagramme de classes — EcommerceApp",
  "classes": [
    {
      "name": "OrderService",
      "type": "class",
      "package": "com.example.order",
      "fields": ["private OrderRepository repo"],
      "methods": ["public Order create()", "public void cancel(Long id)"]
    }
  ],
  "relations": [
    { "from": "OrderService", "to": "OrderRepository", "type": "uses" }
  ],
  "createdAt": "2026-05-13T10:00:00"
}
```

**Endpoints**
```
POST /diagrams                      → création (appelé par analysis-service)
GET  /diagrams/project/{projectId}  → liste les diagrammes d'un projet
GET  /diagrams/{id}                 → détail d'un diagramme
DELETE /diagrams/project/{projectId} → purge avant une nouvelle analyse
```

---

## Communication inter-services

Appels **HTTP synchrones via Eureka** (load-balanced `lb://service-name`).  
Pas de message broker pour l'instant — la complexité n'est pas justifiée.

```
analysis-service → project-service   lb://project-service
analysis-service → diagram-service   lb://diagram-service
```

Un `WebClient` (Spring WebFlux) ou `RestTemplate` sera utilisé dans `analysis-service`.

---

## Stockage des fichiers ZIP

### Stratégie

| Environnement | Solution | Protocole |
|---|---|---|
| Dev local (Docker) | MinIO container | S3-compatible |
| Production (OVH Kubernetes) | OVH Object Storage | S3-compatible |

Le code est identique dans les deux cas — seules les variables d'environnement changent.

### Structure du bucket

```
bucket : analysis-uploads
clé    : projects/{projectId}/{timestamp}-source.zip
ex     : projects/42/2026-05-13T10-00-00-source.zip
```

Le ZIP est conservé après analyse pour permettre une **relance sans re-upload**.

### Variables d'environnement

```bash
# Dev local (MinIO Docker)
MINIO_ENDPOINT=http://minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=analysis-uploads

# Production (OVH Object Storage)
MINIO_ENDPOINT=https://s3.gra.cloud.ovh.net
MINIO_ACCESS_KEY=<ovh-access-key>
MINIO_SECRET_KEY=<ovh-secret-key>
MINIO_BUCKET=analysis-uploads
```

---

## Docker

Ajouts dans `docker-compose.yml` :
- Container **MinIO** (image `minio/minio`, ports 9000/9001)
- Container **MongoDB** (image `mongo:7`)
- Container **analysis-service** (port 8084)
- Container **diagram-service** (port 8085)
- Variable `SPRING_DATA_MONGODB_URI` pour `diagram-service`

Base MongoDB créée automatiquement par Spring Data au premier démarrage.  
Bucket MinIO créé automatiquement au démarrage de `analysis-service` (`@PostConstruct`).

---

## Ordre d'implémentation

1. **`analysis-service`** — upload ZIP + stockage MinIO ✅ *(en cours)*
2. **Ajouts `project-service`** — table violations + endpoints
3. **`diagram-service`** — structure MongoDB + CRUD endpoints
4. **`analysis-service`** — parsing JavaParser + orchestration des appels
5. **Frontend** — upload ZIP, affichage violations, affichage diagramme
