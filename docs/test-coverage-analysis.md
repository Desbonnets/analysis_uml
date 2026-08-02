# Couverture des tests vs user stories / cas d'usage — Architecture & Roadmap

Statut : **implémenté pour Java + PHP** — voir user story 68 dans `frontend/USER_STORIES.md` et
la section "Implémenté" en bas de ce document pour les décisions prises. Python/JS/TS/C/C++
restent à faire (détection "ceci est un test" absente pour ces langages, voir
`analysis-service/CLAUDE.md`).

## Contexte

Nouveau type d'analyse, à côté des diagrammes et du contrôle de conformité déjà
existants (`ConformanceService`, voir `diagram-service/docs/conformance-precision.md`) :
comparer les tests présents dans un projet analysé à un référentiel d'exigences
(user stories / cas d'usage) fourni par l'utilisateur, pour repérer facilement les
fonctionnalités non couvertes par des tests.

Même logique produit que le contrôle de conformité (« l'utilisateur fournit un
référentiel de référence, la plateforme le compare au code réellement analysé »),
appliquée aux tests plutôt qu'au diagramme de classes.

---

## Stratégie de correspondance à deux niveaux

Décision actée (demande explicite) : ne pas choisir entre ID explicite et
mots-clés — combiner les deux, avec le mode ID en priorité et le mode mots-clés en
repli explicitement marqué comme non fiable.

```
Pour chaque test détecté dans le projet :
  1. Cherche une référence d'ID d'exigence sur le test (tag/annotation/commentaire)
       trouvé  → lien CONFIRMÉ vers l'exigence correspondante
       absent  → passe à l'étape 2
  2. Compare le nom/la description du test au texte de chaque exigence
     (recouvrement de mots-clés)
       score au-dessus du seuil → lien HEURISTIQUE (⚠️ non confirmé)
       sinon                    → test non rattaché (n'apparaît dans aucune couverture)
```

### Niveau 1 — ID explicite (autoritaire)

Réutiliser les mécanismes de tag **déjà natifs** de chaque framework de test plutôt
qu'inventer une annotation maison — moins de friction, et ça reste utilisable
directement depuis le test runner de l'utilisateur :

| Framework | Mécanisme natif | Exemple |
|---|---|---|
| JUnit 5 (Java) | `@Tag` | `@Tag("US-67")` |
| PHPUnit | annotation docblock `@group` | `/** @group US-67 */` |
| pytest | `@pytest.mark` custom | `@pytest.mark.story("US-67")` |
| Vitest / Jest | pas de tag natif → convention de nommage | `it('US-67: ...', () => {})` |

Détection technique : suit exactement le pattern déjà en place pour
`ClassDef.entity` (voir `hasEntityAnnotation(...)` dans `JavaLanguageParser`, qui
scanne les modifiers ANTLR d'une classe pour `@Entity`) — même mécanisme appliqué
au niveau méthode pour en extraire l'ID au lieu d'un simple booléen. Pour Vitest/Jest
(regex-based, `JsRegexParser`), extraction par regex sur le premier argument string
de `it(...)`/`test(...)`.

### Niveau 2 — mots-clés (repli, non fiable)

Pour tout test sans ID trouvé : comparer son nom/sa description (ex.
`it('should reject an expired token')`) au texte (titre + description) de chaque
exigence, par recouvrement de mots-clés simple — pas d'appel LLM/embedding pour la
v1, cohérent avec le reste du code (parsers regex/ANTLR, aucun appel réseau — voir
le commentaire en tête de `PlantUmlParser`). Au-dessus d'un seuil de similarité,
lien HEURISTIQUE ; en dessous, le test reste non rattaché.

**Tout résultat obtenu par ce niveau doit porter un avertissement explicite** dans
le rapport (ex. `"confidence": "HEURISTIC", "warning": "Correspondance approximative
par mots-clés — non confirmée, à vérifier manuellement."`) — jamais présenté au même
niveau de confiance qu'un lien confirmé par ID.

---

## Ce qu'il faut construire

### 1. Détection « ceci est un test » par langage (`analysis-service`)

Prérequis pour tout le reste — il faut d'abord savoir quelles méthodes/fonctions
sont des tests, avant de pouvoir en extraire un ID ou un nom à comparer.

| Langage | Détection proposée | Statut |
|---|---|---|
| Java | `@Test` (JUnit 4/5) — même mécanisme ANTLR que `@Entity` | à faire |
| PHP | méthode nommée `test*` ou docblock `@test`, dans une classe étendant `TestCase` | à faire |
| Python | fonction nommée `test_*`, ou méthode d'une classe `TestCase` (unittest) | à faire |
| JS/TS | appel `it(...)` / `test(...)` détecté par `JsRegexParser` (regex) | à faire |
| C / C++ | pas de convention commune | non couvert (même limitation déjà assumée pour la détection d'entités ORM) |

Proposition de modèle : ajouter `MethodDef.isTest` (booléen) + `MethodDef.storyId`
(String, nullable — rempli si un tag niveau 1 est trouvé), sur le même principe que
`ClassDef.entity`.

### 2. Entrée « référentiel d'exigences »

Le produit n'a aujourd'hui aucune notion de user stories/cas d'usage *pour un projet
utilisateur* (le fichier `USER_STORIES.md` est spécifique au dépôt d'analysis_uml
lui-même, pas une donnée stockée par projet dans le produit). Réutiliser l'UX déjà
en place pour le contrôle de conformité : coller/importer un texte structuré
(markdown à puces numérotées, un ID + titre + description par ligne), avec
possibilité de l'enregistrer/réutiliser comme les diagrammes PlantUML de référence
(`SavedUmlDiagram` → même idée pour un `SavedRequirementsList`).

### 3. Service de comparaison (`diagram-service`, nouveau)

Même position architecturale que `ConformanceService` : diffuse une structure
« réelle » (ici : liste des tests avec leur `isTest`/`storyId` remontés via
`AnalysisRecord`/`CodeUnit`/`ClassDef`/`MethodDef`, déjà le chemin de données
existant) contre un référentiel fourni par l'utilisateur.

```
POST /diagrams/{projectId}/test-coverage?recordId=
  body: { requirements: "1. Connexion — ...\n2. Inscription — ...\n..." }
  → TestCoverageReportDto
      { requirementId, title, status: COVERED_CONFIRMED | COVERED_HEURISTIC | UNCOVERED,
        matchedTests: [{ testName, file, confidence, matchedKeywords? }] }[]
```

### 4. Frontend

Nouvel onglet (ou nouvelle page) sur le modèle de l'onglet Conformité de
`DiagramEditor` : zone de collage/import du référentiel d'exigences, bouton
« Vérifier », rapport avec un badge par exigence — vert (confirmé), orange avec ⚠️
(heuristique, à vérifier), rouge (non couverte).

---

## Points à trancher avant implémentation

### 1. Format du référentiel d'exigences en entrée

Markdown à puces numérotées (calqué sur `USER_STORIES.md`) est simple à coller
depuis un backlog existant, mais plus fragile à parser qu'un format structuré
(CSV/JSON avec ID explicite). À trancher selon ce qui sera le plus facile à
remplir pour l'utilisateur en pratique.

### 2. Seuil de similarité pour le niveau 2 (mots-clés)

Trop bas → beaucoup de faux positifs « heuristiques » qui polluent le rapport ; trop
haut → repli quasi inutile, tout finit en « non couvert ». Nécessite un jeu de test
réel (projet + backlog) pour caler la valeur, pas une décision à froid.

### 3. Portée v1 : couverture ≠ correction

Ce mécanisme prouve qu'*un test existe et prétend couvrir* une exigence — pas qu'il
teste correctement le bon comportement. Le rapport doit être présenté comme un outil
de traçabilité, jamais comme une garantie de qualité des tests. À clarifier dans
l'UI (texte d'aide) pour ne pas créer de fausse confiance.

### 4. Étendre plus tard vers un matching sémantique (LLM/embeddings)

Le mots-clés v1 sera probablement insuffisant pour des tests dont le nom ne
recoupe pas le vocabulaire de la user story (ex. test nommé `testEdgeCase42` vs
story « Gérer les erreurs d'analyse »). Un appel LLM/embedding améliorerait le
rappel mais introduit une dépendance externe et un coût — à évaluer une fois le v1
mots-clés en place et ses limites mesurées sur des cas réels, pas à décider
maintenant.

---

## Implémenté (Java + PHP)

Décisions prises à l'implémentation, sur les points laissés ouverts ci-dessus :

- **Format d'entrée (point 1)** : markdown à puces numérotées retenu, `RequirementsParser`
  (`diagram-service/requirements/`) — une exigence par ligne, `"N. **Titre** — description"`
  (gras et séparateur `—`/`-` optionnels), avec le même retrait du marqueur de statut de tête
  (emoji) que celui déjà utilisé dans `USER_STORIES.md`, pour pouvoir coller ce fichier
  directement. Pas de format multi-ligne par exigence en v1 (limitation documentée).
- **Détection "ceci est un test" (section 1)** : Java (`@Test` JUnit 4/5, toutes formes
  d'import) et PHP (méthode `test*` ou docblock `@test`, dans une classe `extends TestCase`)
  implémentés, sur le modèle exact de `hasEntityAnnotation`/`ORM_ENTITY_RE` déjà en place pour
  `ClassDef.entity`. Python/JS/TS/C/C++ non couverts — à ajouter plus tard de la même façon.
- **ID d'exigence (section 1)** : `MethodDef.isTest` (boolean) + `MethodDef.storyId` (String,
  nullable), même principe que `ClassDef.entity`. Java : `@Tag("US-67")` /
  `@Tag(value = "US-67")` (JUnit 5). PHP : docblock `@group US-67`. `storyId` est du texte
  libre — le matching côté `TestCoverageService` extrait les chiffres et les compare à l'ID
  numérique de l'exigence, donc `US-67`/`67`/`#67` sont équivalents.
- **Entrée référentiel (section 2)** : pas de `SavedRequirementsList` en v1 — on colle/importe
  le texte à chaque vérification, comme l'était le contrôle de conformité avant l'ajout de
  `SavedUmlDiagram`. Persistance/réutilisation à ajouter plus tard si le besoin se confirme.
- **Service de comparaison (section 3)** : `TestCoverageService` récupère l'`AnalysisRecord`
  complet via `AnalysisClient.getRecord(...)` directement (pas via `ClassDiagramService`, qui
  aplatit `MethodDef` en chaînes formatées et perdrait `isTest`/`storyId`).
- **Seuil de similarité (point 2)** : recoupement par mots-clés simple — au moins 2 mots
  partagés (camelCase/snake_case découpé, mots vides filtrés), ou un seul mot partagé s'il fait
  au moins 6 caractères. Constantes `MIN_SHARED_KEYWORDS`/`MIN_SINGLE_KEYWORD_LENGTH` dans
  `TestCoverageService`, non calées sur un jeu de test réel — à ajuster si le rapport s'avère
  trop bruyant ou trop silencieux en pratique.
- **Portée v1 (point 3)** : le texte d'aide de l'onglet "Couverture des tests" rappelle
  explicitement que ceci prouve qu'un test existe et prétend couvrir l'exigence, pas qu'il
  teste le bon comportement.
- **Matching sémantique (point 4)** : toujours pas fait, cf. ci-dessus — pas de changement.
