# Contrôle de conformité — niveau de précision configurable

Statut : **`checkFields`/`checkMethods` implémentés** — voir user story 67 dans
`frontend/USER_STORIES.md`. `checkExceptions` reste bloqué (voir section dédiée plus bas),
à traiter comme un chantier séparé côté `analysis-service`.

## Le problème (constaté)

Avec un diagramme de référence :
```
class User {
  +id: Long
  +nom: String
  +prenom: String
  +email: String
  +password: String
}
```
et une classe réelle dans le code :
```java
class User {
  Long id;
  String nom;
  String email;
  String password;
  String region;
}
```
(donc `prenom` manquant, `region` en trop) — **`ConformanceService` ne remonte aucun
écart aujourd'hui**. Seule la structure de haut niveau est vérifiée.

## Pourquoi

Deux limitations connues et déjà documentées dans le code (v1, volontaire) :

1. `PlantUmlParser` (`plantuml/PlantUmlParser.java`) ne parse que la ligne de
   déclaration de classe (`DECLARATION_RE`) — tout ce qui est entre `{ }` (attributs,
   méthodes) est ignoré lors du parsing du diagramme de référence.
2. `ConformanceService.generate(...)` ne compare que : présence de la classe, son
   `type` (class/interface/enum/abstract), et les relations (extends/implements/
   association). Il n'utilise jamais `DiagramNode.fields` / `DiagramNode.methods`
   du côté "réel" (pourtant déjà calculés par `ClassDiagramService.buildNode(...)`
   sous forme `"+ id: Long"`, `"+ place(): void"`).

Donc même si le champ manquant/en trop existe dans les deux structures de données
disponibles, rien ne les diff aujourd'hui.

## Proposition : précision configurable

Ajouter des indicateurs indépendants (pas un niveau ordinal unique — les axes sont
orthogonaux) pour ce que le contrôle de conformité doit vérifier, en plus de la
structure déjà couverte :

| Flag | Vérifie | Statut |
|---|---|---|
| `checkFields` | Attributs : nom + type doivent correspondre entre le diagramme de référence et le code réel | à faire |
| `checkMethods` | Méthodes : nom + types de paramètres + type de retour | à faire |
| `checkExceptions` | Exceptions déclarées par méthode (`throws`) | **bloqué**, voir ci-dessous |

Défaut recommandé : tous à `false` (comportement actuel inchangé) — activer une
vérification plus stricte doit être un choix explicite de l'utilisateur, pour ne pas
faire apparaître d'un coup une avalanche de violations sur des diagrammes de
référence existants après mise à jour.

## Ce qu'il faut changer

### 1. `PlantUmlParser`
Parser le contenu `{ ... }` des déclarations de classe pour en extraire une liste de
membres structurés (pas juste ignorer le bloc comme aujourd'hui). Réutiliser si
possible un format proche de celui déjà émis par `ClassDiagramService.buildNode(...)`
(`"+ nom: Type"` pour les champs, `"+ nom(Type, ...): TypeRetour"` pour les méthodes)
pour rester cohérent avec le côté "réel", ou parser vers des records dédiés
(`FieldDecl(String name, String type)`, `MethodDecl(String name, List<String> paramTypes, String returnType)`)
si un diff plus robuste que du string-matching est voulu (recommandé — un diff sur
string brut est fragile aux espaces/à l'ordre).

### 2. `ConformanceService`
Nouveaux types de violation, chacun conditionné par son flag :
- `FIELD_MISSING`, `FIELD_TYPE_MISMATCH`, `EXTRA_FIELD` (sévérité ERROR / INFO comme
  le pattern existant `MISSING_CLASS` / `EXTRA_CLASS`)
- `METHOD_MISSING`, `METHOD_SIGNATURE_MISMATCH`, `EXTRA_METHOD`
- `EXCEPTION_MISMATCH` (phase 2, voir blocage ci-dessous)

Le matching par nom simple (déjà la limitation connue pour les classes — voir
commentaire en tête de `ConformanceService`) s'applique probablement aussi aux
champs/méthodes : pas de désambiguïsation par signature complète en cas d'overload.
À trancher à l'implémentation.

### 3. `ConformanceRequest` / `DiagramController#checkConformance`
Ajouter les query params `checkFields`, `checkMethods`, `checkExceptions` (booléens),
même pattern que `filter`/`types`/`packageContains` déjà en place pour le filtrage de
périmètre.

### 4. Frontend (`DiagramEditor.tsx`, onglet Conformité)
Nouvelle ligne de toggles à côté de celle "Classes vérifiées" ajoutée pour le
filtrage de périmètre : "Précision : [Attributs] [Méthodes] [Exceptions]". Le toggle
"Exceptions" doit rester désactivé/grisé tant que le point ci-dessous n'est pas
résolu côté analysis-service.

## Blocage : les exceptions ne sont pas capturées en amont

`MethodDef` (modèle miroir dans `diagram-service`, source dans `analysis-service`)
n'a aucun champ `exceptions`/`throws` aujourd'hui, et aucun des 6 parsers de langage
(`JavaLanguageParser`, `PhpLanguageParser`, `PythonLanguageParser`, `JsRegexParser`,
`CLanguageParser`, `CppLanguageParser`) ne les extrait. `checkExceptions` nécessite
donc d'abord un travail en amont dans `analysis-service` (grammaire ANTLR pour Java,
etc.) avant d'être faisable côté `diagram-service`. À traiter comme une phase 2
séparée — livrer `checkFields`/`checkMethods` d'abord.

## Tests à prévoir

- `PlantUmlParserTest` : cas avec attributs/méthodes dans le corps de classe.
- `ConformanceServiceTest` : reprendre l'exemple `User` de ce document (attribut
  manquant + attribut en trop) comme fixture, avec le flag activé/désactivé pour
  vérifier la non-régression du comportement par défaut.

## Implémenté (`checkFields` / `checkMethods`)

Décisions prises à l'implémentation, sur les points laissés ouverts ci-dessus :

- **Matching** : les attributs sont matchés par nom simple ; les méthodes par
  nom + types de paramètres (`getId()` et `getId(Long)` sont deux entrées
  distinctes), ce qui gère correctement les surcharges les plus courantes sans
  diff de signature complet.
- **Réutilisation du format** : pas de nouveaux records de parsing séparés pour
  le côté "réel" — `PlantUmlParser#parseField`/`parseMethod` sont exposés et
  réutilisés tels quels sur les chaînes déjà produites par
  `ClassDiagramService#buildNode` (même convention `"+ nom: Type"` des deux
  côtés), donc pas de diff sur du texte brut.
- **Classe de référence sans corps** : `class Foo` sans `{ }` est exemptée du
  diff de membres même si `checkFields`/`checkMethods` sont actifs — l'absence
  de corps veut dire "membres non spécifiés", pas "aucun membre attendu".
  Un corps vide explicite (`class Foo {}`) déclenche en revanche `EXTRA_FIELD`/
  `EXTRA_METHOD` pour tout membre réel.
- **`checkExceptions`** : toujours bloqué (voir section dédiée), le toggle
  frontend correspondant reste désactivé/grisé.
