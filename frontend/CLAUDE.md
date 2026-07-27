# Frontend

## Data flow

**Wired to real API (gateway on port 8080):**
- `src/api/auth.ts` — login, register → `/auth/**`
- `src/api/profile.ts` — `getMe`, `updateMe` → `/auth/me`
- `src/api/users.ts` — admin CRUD → `/users/**`
- `src/api/roles.ts` — list roles → `/roles/**`
- `src/api/analysis.ts` — `uploadAndAnalyze`, `getAnalysisHistory` → `/analysis/**`
- `src/api/diagrams.ts` — `getClassDiagram`, `getDependencyGraph`, `getPackageDiagram`, `getMetrics` → `/diagrams/**`
- Auth state persisted in `localStorage` via `AuthContext` (keys: `auth_token`, `auth_user`)

**Still mocked via JSON files in `src/data/`:**
- `projects.json`, `violations.json`, `ai-messages.json`
- `diagrams.json` — conservé mais plus utilisé (DiagramsList et DiagramEditor utilisent maintenant l'API réelle)

**Type source of truth:** `src/types/index.ts`
- `AuthUser` — shape stored in localStorage and returned by `/auth/**` (role as `RoleName` string)
- `UserAdmin` — shape returned by `/users/**` (role as full `RoleInfo` object)
- `RoleInfo` — full role object with permissions array

## Routing

```
/login, /register                              → public
/dashboard, /projects, /diagrams, /analysis, /ai, /settings  → ProtectedRoute (token required)
/diagrams                                      → DiagramsList (sélecteur projet + historique analyses)
/diagrams/:projectId/:recordId                 → DiagramEditor (3 onglets: Classe/Dépendances/Packages)
/admin/users                                   → AdminRoute (role === 'admin', redirects to /dashboard otherwise)
```

`AdminRoute` in `src/components/auth/AdminRoute.tsx`. Sidebar shows the **Administration** section only when `user.role === 'admin'`.

**Flux Diagrammes UML :**
1. `DiagramsList` → sélectionne un projet → appelle `GET /analysis/{projectId}/history`
2. Clic sur une ligne → navigue vers `/diagrams/{projectId}/{recordId}`
3. `DiagramEditor` → appelle diagram-service à la volée → affiche SVG avec 3 onglets

## Component layers

- `src/components/layout/` — `Layout` (shell), `Sidebar` (nav + admin section), `Header` (topbar)
- `src/components/auth/` — `ProtectedRoute`, `AdminRoute`
- `src/components/ui/` — `Button`, `Pill`, `Badge`, `Avatar`, `MetricCard`, `StatCard`, `Logo`
- `src/pages/` — one file per route
- `src/pages/admin/` — admin-only pages (`Users.tsx` — full CRUD table)

## Design conventions

The UI uses a CSS custom property design system defined in `src/index.css`:

- **Colors**: use `var(--bg-0..4)`, `var(--fg-0..3)`, `var(--accent)` (#5BC0BE teal), `var(--ok/warn/bad/info)`. No hardcoded hex values or Tailwind color utilities.
- **CSS classes**: prefer design system classes (`.btn`, `.card`, `.pill`, `.sidebar`, `.topbar`, `.table`) over inline styles for structural elements.
- **Fonts**: `var(--font-sans)` (Inter) for UI, `var(--font-mono)` (JetBrains Mono) for code, metrics, numeric values.
- **No emojis** in the product UI.
- **Pill vs Badge**: use `<Pill tone="ok|warn|bad|info|neutral">` directly in new code. `<Badge>` is a legacy wrapper.
