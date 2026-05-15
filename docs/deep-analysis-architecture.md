# Deep Analysis — Architecture & Roadmap

## Contexte

L'`analysis-service` dispose d'une **analyse rapide** (fast) qui extrait la structure statique du code (classes, méthodes, champs, dépendances) en quelques secondes. Une option **analyse profonde** (deep) est prévue pour les utilisateurs premium afin de produire des graphes et conclusions plus riches.

---

## Deux modes d'analyse

```
POST /analysis/{projectId}?depth=deep    ← paramètre optionnel (défaut : fast)
     │
     ├─ Vérification plan (JWT → plan === 'pro' | 'enterprise')
     │
     ├─ FAST (défaut, tous les utilisateurs)
     │    Synchrone ~1s
     │    Réponse immédiate avec CodeUnit[]
     │    Analyse structurelle uniquement (corps de méthodes skippés)
     │
     └─ DEEP (premium uniquement)
          Asynchrone — répond immédiatement avec { jobId, status: "pending" }
          Traitement en arrière-plan
          Résultats récupérables via GET /analysis/jobs/{jobId}
```

---

## Ce que l'analyse fast extrait (actuel)

| Donnée | Détail |
|---|---|
| Package + imports | |
| Déclaration de type | class / interface / enum / record / annotation |
| Visibilité | public / protected / private / package-private |
| Héritage | extends + implements |
| Méthodes | nom, type de retour, paramètres (types), visibilité, static, abstract |
| Champs | nom, type, visibilité, static, final |
| Dépendances directes | types référencés dans signatures et champs |

**Diagrammes possibles :** diagramme de classes UML, graphe de dépendances structurel.

**Violations SOLID détectables :** SRP basique (trop de méthodes/champs), ISP (interface trop large), DIP partiel (champs vers classes concrètes).

---

## Ce que l'analyse deep ajouterait

| Donnée | Utilité |
|---|---|
| **Call graph** (qui appelle qui) | Graphe de dépendances dynamique |
| **Instanciations `new`** dans les corps | Violation DIP complète |
| **Switch / instanceof sur types concrets** | Violation OCP |
| **Complexité cyclomatique** | Méthodes trop complexes |
| **Longueur des méthodes** | Code smell |
| **Couplage afférent / efférent** | Stabilité des modules |
| **Dead code** (méthodes jamais appelées dans le projet) | Nettoyage |

**Diagrammes supplémentaires :** graphe d'appels, carte de complexité, graphe de couplage inter-modules.

**Violations SOLID complètes :** OCP (switch/instanceof), LSP (override avec exceptions non prévues), DIP (new sur concrètes dans constructeurs).

---

## Architecture technique

### Flow async

```
POST /analysis/{projectId}?depth=deep
  → 202 Accepted  { jobId: "abc123", status: "pending" }

  [en arrière-plan]
  → Extraction ZIP (déjà fait)
  → Analyse structurelle ANTLR4 (déjà fait)
  → Analyse profonde : JavaParser pour corps Java, ANTLR4 étendu pour autres langages
  → Sauvegarde résultats

GET /analysis/jobs/{jobId}
  → { status: "running" | "done" | "failed", result: DeepAnalysisResult }
```

### Stockage des jobs

Option retenue pour le MVP : **table PostgreSQL dans `analysis-service`**.

```
analysis_jobs
  ├─ id (UUID)
  ├─ project_id
  ├─ owner_email
  ├─ status (PENDING | RUNNING | DONE | FAILED)
  ├─ depth (FAST | DEEP)
  ├─ result_key (clé MinIO du JSON de résultat)
  ├─ error_message
  ├─ created_at
  └─ completed_at
```

Les résultats (potentiellement volumineux) sont stockés dans **MinIO** sous `projects/{projectId}/jobs/{jobId}-result.json` et référencés par `result_key`.

### Threading

Spring `@Async` avec un pool de threads dédié (ex. 4 threads max) — suffisant pour un MVP. Pas besoin de RabbitMQ/Kafka avant que la charge le justifie.

```java
@Async("deepAnalysisExecutor")
public void runDeepAnalysis(String jobId, byte[] zipContent) { ... }
```

### Parser deep

| Langage | Parser fast | Parser deep |
|---|---|---|
| Java | ANTLR4 (grammaire structurelle) | JavaParser (corps de méthodes) |
| JavaScript / TypeScript | ANTLR4 | ANTLR4 étendu |
| Python | ANTLR4 | ANTLR4 étendu |
| PHP, C, C++ | ANTLR4 | ANTLR4 étendu |

---

## Points à trancher avant implémentation

### 1. Vérification du plan premium

Le JWT actuel ne contient que l'email — pas le plan (`free` / `pro` / `enterprise`).

**Options :**

| Option | Avantage | Inconvénient |
|---|---|---|
| Enrichir le JWT avec `plan` | Sans appel inter-service | Plan en cache — changement de plan pas immédiat |
| Appel vers `auth-service` à chaque requête | Toujours à jour | Couplage inter-service, latence |
| Middleware gateway qui injecte un header `X-User-Plan` | Centralisé | Complexité gateway |

**Recommandation MVP :** enrichir le JWT avec le plan (le plan change rarement).

### 2. Expiration des jobs

Définir une TTL pour les résultats stockés dans MinIO (ex. 7 jours) et nettoyer les jobs anciens via un scheduler `@Scheduled`.

### 3. Limites par plan

| Plan | Analyse fast | Analyse deep | Taille ZIP max |
|---|---|---|---|
| free | ✅ | ❌ | 10 MB |
| pro | ✅ | ✅ | 50 MB |
| enterprise | ✅ | ✅ | 200 MB |

---

## Étapes d'implémentation (ordre suggéré)

1. **Enrichir le JWT** avec le champ `plan` dans `auth-service`
2. **Créer la table `analysis_jobs`** dans `analysis-service` (+ datasource PostgreSQL)
3. **Implémenter le endpoint async** `POST /analysis/{projectId}?depth=deep` → job ID
4. **Implémenter `GET /analysis/jobs/{jobId}`** pour polling du statut
5. **Intégrer JavaParser** pour l'analyse des corps de méthodes Java
6. **Implémenter les analyseurs** (call graph, complexité cyclomatique, violations SOLID complètes)
7. **Stocker les résultats** dans MinIO et référencer dans `analysis_jobs`
8. **Scheduler de nettoyage** des jobs expirés
