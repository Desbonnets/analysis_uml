# Tester l'intégration CI en local

Ces commandes simulent ce que fait le GitHub Action, sans avoir besoin d'un pipeline CI.  
Les services doivent être démarrés (Docker ou mode dev).

---

## Étape 1 — Obtenir un JWT

**Git Bash / curl**
```bash
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@dev.local","password":"Alice1234!@#"}'
```

**PowerShell**
```powershell
$login = Invoke-RestMethod -Uri http://localhost:8080/auth/login `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"alice@dev.local","password":"Alice1234!@#"}'
$jwt = $login.token
```

---

## Étape 2 — Générer un token API pour le projet

Remplace `1` par l'id de ton projet (visible dans l'URL de la page détail).

**Git Bash / curl**
```bash
curl -s -X POST http://localhost:8080/projects/1/token \
  -H "Authorization: Bearer <ton-jwt>"
# → {"token":"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
```

**PowerShell**
```powershell
$res = Invoke-RestMethod -Uri http://localhost:8080/projects/1/token `
  -Method POST -Headers @{ Authorization = "Bearer $jwt" }
$projectToken = $res.token
```

> Le token peut aussi être généré depuis l'interface : page détail projet > section **Intégration CI** > bouton **Générer**.

---

## Étape 3 — Envoyer un rapport d'analyse

Cet appel ne nécessite pas de JWT — uniquement le `X-Project-Token`.  
C'est exactement ce que le GitHub Action envoie.

**Git Bash / curl**
```bash
curl -s -X POST http://localhost:8080/projects/1/report \
  -H "Content-Type: application/json" \
  -H "X-Project-Token: <ton-project-token>" \
  -d '{"score":82,"violationsCount":3,"diagramsCount":5,"status":"analyzed"}'
# → HTTP 200
```

**PowerShell**
```powershell
Invoke-RestMethod -Uri http://localhost:8080/projects/1/report `
  -Method POST -ContentType "application/json" `
  -Headers @{ "X-Project-Token" = $projectToken } `
  -Body '{"score":82,"violationsCount":3,"diagramsCount":5,"status":"analyzed"}'
```

---

## Vérification

Ouvre la page du projet dans le frontend — le score et les compteurs doivent être mis à jour.

### Valeurs `status` acceptées

| Valeur | Effet affiché |
|--------|--------------|
| `analyzed` | Analysé (vert) |
| `pending` | En cours (orange) |
| `error` | Erreur (rouge) |
| `new` | Nouveau (neutre) |
