# Architecture de sécurité

## Vue d'ensemble du flux

```
Browser
  └─ localStorage (JWT + user)
       └─ Authorization: Bearer <token>
            └─ Gateway:8080  ← CORS filtré ici
                 ├─ auth-service:8081    ← émet les JWT, stocke les users
                 ├─ project-service:8083 ← valide les JWT (stateless)
                 └─ analysis-service:8084 ← valide les JWT (stateless)
```

---

## 1. Authentification — auth-service

### Émission du JWT (`JwtUtil.java`)

- Algorithme : **HMAC-SHA** avec clé symétrique (Base64-décodée depuis `app.jwt.secret`)
- Payload : `subject = email`, `issuedAt`, `expiration`
- Durée configurable via `app.jwt.expiration-ms`
- La même clé secrète est partagée entre tous les services pour la validation — c'est le contrat de confiance inter-services

### Stockage des mots de passe

- **BCrypt** via `BCryptPasswordEncoder`
- Validation à l'inscription : min 12 chars, majuscule + minuscule + chiffre + caractère spécial
- Regex : `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,}$`

### Modèle utilisateur

```
AppUser
  ├─ email (unique)
  ├─ password (BCrypt hash)
  ├─ plan (free / pro / enterprise)
  └─ role ─── @ManyToOne ──► Role
                               ├─ name (admin / architect / developer)
                               └─ permissions (Set<String> dans role_permissions)
```

### Règles d'accès (`SecurityConfig`)

| Route | Accès |
|---|---|
| `/auth/register`, `/auth/login`, `/actuator/health` | Public |
| `/users/**` | `ROLE_ADMIN` uniquement |
| `GET /roles/**` | Tout utilisateur authentifié |
| Tout le reste | Authentifié |

---

## 2. Validation JWT dans les services métier (stateless)

`project-service` et `analysis-service` appliquent le même pattern :

```
Request
  └─ JwtAuthFilter (OncePerRequestFilter)
       ├─ Extrait le token du header Authorization: Bearer <token>
       ├─ Décode + vérifie la signature (même clé secrète)
       ├─ Vérifie expiration
       └─ Injecte un UserDetails minimal (email, pas de rôles)
            └─ → SecurityContextHolder
```

`JwtUserDetailsService` retourne un `User(email, "", List.of())` — ces services ne connaissent pas les rôles, ils savent seulement que le token est valide. Les erreurs de token sont silencieusement ignorées (`catch` vide) ; la requête continue sans authentification et Spring Security bloque côté `authorizeHttpRequests`.

### Règles d'accès — project-service

| Route | Accès |
|---|---|
| `/actuator/health` | Public |
| `POST /projects/*/report` | Public (webhook CI, auth par `X-Project-Token`) |
| Tout le reste | JWT valide requis |

### Règles d'accès — analysis-service

| Route | Accès |
|---|---|
| `/actuator/health` | Public |
| Tout le reste | JWT valide requis |

### Comparaison auth-service vs services métier

| | auth-service | project / analysis-service |
|---|---|---|
| `UserDetailsService` | Requête BDD (`UserRepository`) | Stateless — crée un User en mémoire |
| Rôles chargés | Oui (depuis DB) | Non |
| Génère des tokens | Oui | Non |
| `AuthenticationProvider` configuré | Oui (`DaoAuthenticationProvider`) | Non |

---

## 3. Gateway — CORS

Le gateway est le seul point d'entrée depuis le browser. Il gère les CORS via `GatewayCorsConfig` :

| Paramètre | Valeur |
|---|---|
| Origines autorisées | `app.cors.allowed-origins` (liste, multi-environnement) |
| Méthodes | GET, POST, PUT, DELETE, OPTIONS, PATCH |
| Headers | `*` |
| Credentials | Autorisés |
| Cache preflight | 3600s |

Les services internes ont CORS **désactivé** (`AbstractHttpConfigurer::disable`) — ils ne sont jamais exposés directement au browser.

---

## 4. Frontend — gestion de session

### Stockage

Token et user stockés dans `localStorage` (clés `auth_token` et `auth_user`).

- **Avantage** : persiste entre les onglets et rechargements
- **Inconvénient** : vulnérable au XSS — à remplacer par `HttpOnly cookie` en production

### Flux de connexion

```
LoginPage → POST /auth/login → { token, user } → localStorage → AuthContext → React state
```

### Protection des routes

| Composant | Rôle |
|---|---|
| `ProtectedRoute` | Vérifie la présence du token en mémoire |
| `AdminRoute` | Vérifie `user.role === 'admin'` depuis localStorage |

L'UI se cache côté client, mais c'est le backend qui enforce réellement les droits (`hasRole("ADMIN")`).

### Transmission du token

```typescript
Authorization: Bearer ${token}   // dans chaque appel apiRequest()
```

---

## 5. Points de vigilance

| Problème | Localisation | Impact |
|---|---|---|
| JWT en `localStorage` | Frontend | Exposé au XSS — migrer vers `HttpOnly cookie` en prod |
| Permissions non enforced | `Role.permissions` | Stockées en DB mais pas vérifiées dans le code (informatif uniquement) |
| Clé JWT partagée (symétrique) | Tous les services | Acceptable en interne, mais un service compromis peut forger des tokens |
| Email change invalide le token | auth-service | JWT contient l'email — l'utilisateur doit se reconnecter après un changement d'email |
| CORS désactivé dans les services internes | project / analysis | Correct car non exposés directement — à maintenir ainsi |

---

## Chantiers avant mise en production

1. **Migrer le token vers un `HttpOnly cookie`** — élimine le risque XSS lié au `localStorage`
2. **Implémenter le contrôle des permissions** — les permissions du système de rôles sont stockées en DB mais non vérifiées dans le code
3. **Envisager JWT asymétrique (RS256)** — auth-service signe, les autres services vérifient avec la clé publique uniquement (un service compromis ne peut plus forger de tokens)
