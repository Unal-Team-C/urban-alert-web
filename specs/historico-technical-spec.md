# Technical Specification — UrbanAlert Report History (Frontend)

**Version:** 0.2.0 (draft)
**Date:** 2026-10-07
**Status:** Draft — pending review
**Functional spec:** [historico-functional-spec.md](historico-functional-spec.md)

---

## 1. Approach

A new route `/historial` inside the existing app (`frontend/reportes-front`, Next.js 16 App Router, React 19, Tailwind 4, TypeScript strict). No new dependencies unless stated. The form page at `/` is not modified, apart from an optional link (functional spec OQ-1).

The module is a **client-side consumer**: pages are Client Components that call the gateway from the browser, same as the form does today. Reasons: the services are only reachable through the gateway, Auditoría needs no browser credentials in dev mode, and the form already follows this pattern.

## 2. How the browser reaches each service

All calls are same-origin `fetch("/api/v1/...")`.

| Need | Path | Notes |
|---|---|---|
| Reports | `/api/v1/reportes` | Gateway rewrites to `/api/v1/Reportes` |
| Catalog | `/api/v1/reportes/catalogo` | Labels for category / type |
| Users | `/api/v1/usuarios` | Gateway rewrites to `/api/v1/users` |
| Coordinate | `/api/v1/geoespacial/coordinates/{id}` | GET only |
| Audit | `/api/v1/auditoria/reportes/{id}[?limit&cursor]` and `.../integridad` | Gateway adds `X-Urban-Gateway-Key` |

**Running it.** Auditoría answers 403 without the gateway key, and Geoespacial/Auditoría have no rewrites in `next.config.ts`. So the module is developed and tested **through the compose gateway** (`infrastructure/`, `http://localhost:8080`, with `AUDITORIA_MODO_DESARROLLO=true`). `npm run dev` alone supports only Reportes and Usuarios; we do not add rewrites that would need the shared secret in the front.

## 3. Structure

```
app/
  historial/
    layout.tsx                fixed bg/text colors, see §5 Theme
    page.tsx                  list + totals (client)
    [id]/page.tsx             detail + timeline (client)
    components/
      TotalesGrid.tsx         state / level cards
      FiltrosHistorial.tsx    state, level and type selects (type grouped by category)
      TotalesPorTipo.tsx      collapsed panel, per-category lazy totals
      TablaReportes.tsx       rows + pager
      DetalleReporte.tsx
      LineaDeTiempo.tsx
      VerificacionIntegridad.tsx
      Estados.tsx             Loading / Empty / ErrorReintentar
  lib/
    api.ts                    fetch wrapper + ErrorApi mapping
    reportes.ts               types + listarReportes, obtenerReporte, contarPor
    auditoria.ts              types + obtenerLineaDeTiempo, verificarIntegridad
    geoespacial.ts            obtenerCoordenada
    catalogo.ts               types + etiquetas (código → nombre)
    formato.ts                fecha en America/Bogota
```

`lib/usuarios.ts` already exists; we add `listarUsuarios` and `nombreDeUsuario` there (used to map `IdUsuario`/`IdResponsable`/`actorId` to names) rather than duplicating. Added `useCarga.ts`, a small hook that loads one resource per page section so a failure stays local. Dynamic route `params` is a `Promise` in Next 16 (`await params` in server code, `use(params)` in a Client Component).

## 4. Types

Mirror the backend. Enums travel as UPPER_SNAKE_CASE codes.

```ts
type Pagina<T> = { elementos: T[]; pagina: number; tamanoPagina: number; totalElementos: number };

type Reporte = {
  id: string; categoria: string; tipo: string; descripcion: string;
  idCoordenada: string; urlImagen: string | null; nombreImagen: string | null;
  idUsuario: string; nivelEmergencia: string; estado: string;
  fecha: string;                         // ISO, UTC
  idResponsable: string | null; motivoRechazo: string | null;
};

type EventoAuditoria = {
  sequence: number; eventId: string; eventType: string; version: number;
  occurredAt: string; actorId: string; correlationId: string | null;
  data: Record<string, unknown>; previousHash: string; hash: string;
};
type LineaDeTiempo = { reportId: string; items: EventoAuditoria[]; nextCursor: string | null };

type Integridad = {
  reportId: string; verified: boolean; reportEventCount: number; chainEventCount: number;
  headMatches: boolean; brokenSequence: number | null; checkedAt: string;
};

type Coordenada = { coordinateId: string; reportId: string; coordinate: { lat: number; lon: number } };
```

State and level code lists are not duplicated by hand where the catalog can provide them. The catalog covers category/type only, so state and level code→label maps live in `lib/catalogo.ts`. State codes: `REPORTADO, VERIFICADO, ASIGNADO, EN_INTERVENCION, RESUELTO, RECHAZADO`; level codes: `DEFAULT, BAJA, MEDIA, ALTA` (from the enums and `CodigoEnum` in Reportes; the query binder accepts the same codes). Re-checked against a real response in `historico-verify.md`.

## 5. Behaviour

### List (`/historial`)
- URL query is the source of truth: `?estado=&nivel=&pagina=`. Changing a filter resets `pagina` to 1.
- Request: `GET /api/v1/reportes?estado&nivelEmergencia&pagina&tamanoPagina=20`. Backend already orders by date descending.
- Pager uses `totalElementos` / `tamanoPagina`.
- Aborts the in-flight request (`AbortController`) when filters change, to avoid out-of-order results.

### Totals
- `contarPor("estado" | "nivelEmergencia", valor)` → `GET ...?{param}={valor}&tamanoPagina=1`, returns `totalElementos`.
- Fired in parallel with `Promise.allSettled` (6 states + 4 levels). A failed card shows "—" and a retry, it does not break the others.
- Respects no cross-filtering: cards show system totals regardless of the active list filters.

### Detail (`/historial/[id]`)
- Loads in parallel: report, users, catalog. Then coordinate (needs `idCoordenada`). Each part fails independently.
- 404 → "Reporte no encontrado".
- Image: `urlImagen` when present; nothing otherwise.

### Timeline
- `GET /api/v1/auditoria/reportes/{id}?limit=50`; "Cargar más" follows `nextCursor`.
- Each entry: formatted `eventType`, actor name (via users map, fallback to short id), time in `America/Bogota`.
- Unknown `eventType` values render as the raw string, so new backend events show up without a frontend change.
- 403/404/5xx affect only this section.

### Integrity
- Button calls `.../integridad`; shows *Válida* when `verified`, otherwise *Alterada* with `brokenSequence`.
- It is on-demand, not automatic.

### Type filter and totals
- `?tipo=<code>` is sent as `tipo`; combined with `estado` and `nivelEmergencia`.
- `TotalesPorTipo` is collapsed by default. Expanding a category requests `contarPor("tipo", código)` only for its types that have no total yet; collapsing and re-expanding does not repeat requests. A failed type shows "—" with retry. Nothing is requested for the 51 types on page load.
- The request controller is created inside the effect (React re-runs effects in development; one created outside would stay aborted).

### Theme
`globals.css` switches the base text/background colors with `prefers-color-scheme`. `/historial` has its own `layout.tsx` (`bg-gray-100 text-gray-900`), as the report form does, so the module looks the same in light and dark system themes.

## 6. Error handling

`lib/api.ts` throws a typed `ApiError { status, message }`. Message is taken from `{message}` / ProblemDetails `{title, errors}` with the same rules as the form's `leerError`. The form page is not touched (T-2), so the rules are mirrored in `lib/api.ts` rather than extracted. Mapping follows the functional spec §6. Network failure → "No fue posible conectar", with retry.

## 7. Security notes

- The UI sends no identity. In Auditoría dev mode the default identity is the seeded admin. This is development-only (functional spec §7.6).
- No secrets in the front. Nothing from Auditoría's `data` is rendered as HTML; always as text (React escaping).
- Authorization is the backend's job; the UI hides nothing for security.

## 8. Testing

The app has no test setup today. Proposal, minimal and optional dependency-wise:

| Level | Tool | What |
|---|---|---|
| Unit | Vitest | `formato.ts`, `contarPor`, error mapping, query-string ↔ filters |
| Component | Vitest + Testing Library | list states (loading/empty/error), timeline with one and many events, integrity result |
| Manual E2E | Compose + browser | list, filters, totals match `TotalElementos`, detail, timeline, integrity |

Adds `vitest`, `@testing-library/react`, `jsdom` as dev dependencies. Approved (T-1).

Verification before calling it done: `npm run lint`, `npm run build`, unit/component tests, and a manual pass against the compose with real data.

## 9. Out of scope / later

- Real authentication.
- Extra audit events (state changes, assignment, rejection).

## 10. Decisions

| ID | Decision |
|---|---|
| T-1 | Vitest + Testing Library added as dev dependencies. |
| T-2 | `/historial` is reached by URL only; the form page is not modified. |
