# Functional Specification — UrbanAlert Report History (Frontend)

**Version:** 0.4.0 (draft)
**Date:** 2026-10-07
**Author:** UrbanAlert Team C
**Status:** Draft — pending review
**Owner:** Andrés ("Historial detallado / Dashboard de daños", per *Contratos UrbanAlert*)

---

## 1. Overview

The **Report History** is an administrator-facing module that lives **inside the existing Next.js app** (`frontend/reportes-front`, route `/historial`). It lets an administrator browse every damage report registered in the platform, filter it, and open a detailed timeline of what happened to each report (creation, verification, assignment, intervention, resolution or rejection).

It is a **read-only consumer** of existing services, reached through the local gateway (`/api/v1/*`). It owns no data and **does not change the backend** in this iteration.

### Scope

| In scope | Out of scope |
|---|---|
| Paginated, filterable list of reports | Creating reports (existing form, Diana) |
| Report detail view | Map views (Fabian) |
| Per-report audit timeline | Work-order detail / progress % (Julian) |
| Integrity check badge | Changing state / level / assignment of a report |
| Totals by state, level and type | Authentication UI / Identity Provider |
| Responsive layout, loading / empty / error states | Backend changes (see §7 Known Gaps) |

---

## 2. Actors

| Actor | Role | Can do |
|---|---|---|
| **Administrator** | `ADMIN` (Usuarios) / `admin` (Auditoría) | Everything in this module |

The history is an administrator view. Citizens and `gestor` are out of scope; the Audit service already applies its own per-role rules, so no extra work is needed to exclude them.

---

## 3. User Stories

### US-H01 — Browse the report history
**As an** administrator, **I want to** see a paginated list of reports, **so that** I can follow what has been reported.

Acceptance criteria:
- Each row shows: category and type, short description, state, emergency level and date. Location is shown only in the detail view (one lookup instead of one per row).
- Sorted by date, newest first.
- Page size defaults to 20 (backend caps at 100); pager shows current page and allows next/previous.
- Loading skeleton while fetching; empty state when there are no results; error state with retry when the request fails.

### US-H02 — Filter the history
**As an** administrator, **I want to** filter by state, emergency level and type, **so that** I can find relevant reports quickly.

Acceptance criteria:
- Filters map to the backend query parameters `estado`, `nivelEmergencia` and `tipo`; they combine.
- The type selector groups the catalog's types by category.
- Changing a filter resets to page 1.
- Active filters are reflected in the URL (shareable / back-button friendly).

### US-H03 — View a report's detail
**As an** administrator, **I want to** open a report, **so that** I can see all of its information.

Acceptance criteria:
- Shows category, type, description, image (if any), date, state, emergency level, location (lat/lon), reporting user, responsible (if any) and rejection reason (if rejected).
- Unknown id returns a clear "Report not found" page (backend 404).

### US-H04 — View the report timeline
**As an** administrator, **I want to** see the chronological list of events of a report, **so that** I understand its lifecycle.

Acceptance criteria:
- Ordered oldest → newest with event type, actor, and timestamp (`America/Bogota`).
- Loads more entries via cursor when there are more than the page limit.
- If the audit service has only the creation event, the timeline shows it and does not look broken.
- Audit failure (403/404/5xx) degrades the section only, not the whole page.

### US-H05 — Verify audit integrity (admin)
**As an** administrator, **I want to** verify the hash chain of a report's audit trail, **so that** I can detect tampering.

Acceptance criteria:
- Result shown as *Valid* / *Altered*, with the failing sequence if the API reports one.

### US-H06 — Totals
**As an** administrator, **I want to** see how many reports exist per state and per emergency level, **so that** I get an overview of damages (the "Dashboard de daños" part of the assignment).

Acceptance criteria:
- One card per state and per emergency level, with the exact total of the system.
- Totals come from the backend's `TotalElementos` (one request per value with `tamanoPagina=1`), never from counting a loaded page.
- Clicking a card applies that filter to the list; clicking the active card removes it.
- Totals by type (the catalog has 51 types in 9 categories) live in a collapsed panel. Categories are collapsed inside it and a category's totals are requested only the first time it is expanded, so opening the page costs 10 requests, not 61.

---

## 4. Business Rules

| ID | Rule |
|---|---|
| BR-01 | The module never mutates reports or audit data. |
| BR-02 | Page size sent to the API is 1–100; default 20. |
| BR-03 | Dates are stored in UTC and displayed in `America/Bogota`. |
| BR-04 | Authorization is enforced by the backend; the UI is not a security boundary. |

### Vocabulary

| Concept | Values |
|---|---|
| State | Reportado, Verificado, Asignado, EnIntervencion, Resuelto, Rechazado (`Cerrado` appears in contracts but not yet in backend) |
| Emergency level | Por definir (default), Bajo, Medio, Alto |
| Damage type / state / level | Backend now emits codes (UPPER_SNAKE_CASE); labels come from `GET /api/v1/reportes/catalogo` |

---

## 5. Consumed API Contract

| Purpose | Endpoint | Service |
|---|---|---|
| List | `GET /api/v1/Reportes?estado&nivelEmergencia&pagina&tamanoPagina` → `PaginaDto<ReporteDto>` | Reportes |
| Detail | `GET /api/v1/Reportes/{id}` → `ReporteDto` / 404 | Reportes |
| Timeline | `GET /auditoria/reportes/{id}?limit&cursor` → `AuditTimeline` | Auditoría |
| Integrity | `GET /auditoria/reportes/{id}/integridad` → `AuditIntegrityReport` | Auditoría (admin) |
| User name | `GET /api/v1/usuarios` → `{id, name, email, role}` | Usuarios |
| Coordinates | `GET /api/v1/geoespacial/coordinates/{idCoordenada}` | Geoespacial |
| Catalog | `GET /api/v1/reportes/catalogo` | Reportes |

`ReporteDto`: `Id, Categoria, Tipo, Descripcion, IdCoordenada, UrlImagen?, NombreImagen?, IdUsuario, NivelEmergencia, Estado, Fecha, IdResponsable?, MotivoRechazo?`. `PaginaDto`: `Elementos, Pagina, TamanoPagina, TotalElementos`.

The exact shapes of `PaginaDto`, `AuditTimeline` and `AuditIntegrityReport` are taken from the backend source in the technical spec.

---

## 6. Error Catalog (UI behaviour)

| Condition | UI |
|---|---|
| 400 | Inline message with backend `message` |
| 401 | Prompt to sign in |
| 403 | "You don't have access to this report" |
| 404 | "Report not found" |
| 5xx / network | Retry button; rest of the page keeps working |

---

## 7. Known Gaps and Constraints

None are fixed by this module (no backend changes).

1. **Audit only records creation** (`ReporteCreadoEvent`). Timelines currently have one entry; the UI is built for the full timeline and fills in when more events are published.
2. **List has no lat/lon**, only `IdCoordenada`. Location is resolved in the detail view through the gateway lookup (`{coordinateId, reportId, coordinate:{lat,lon}}`).
3. **`IdUsuario` of a report** is whichever user the form picked; names are resolved through Usuarios.
4. **State `cerrado`** is in the contracts, absent from the backend.
5. **No stats endpoint**: totals use one small request per filter value. Acceptable at this volume; a dedicated endpoint would be better if it grows.
6. **Auth:** there is no login. Auditoría runs in development mode (`Autenticacion__ModoDesarrollo=true`), where identity comes from `X-Usuario-Id` / `X-Usuario-Rol` headers (default: seeded admin). The UI sends no credentials; the gateway adds the shared key. Unsafe outside development.

---

## 8. Decisions and Open Questions

| ID | Decision / Question | Status |
|---|---|---|
| D-1 | Same app (`reportes-front`), new route `/historial`, based on the most recent branch (`infra-docker-compose`) | Decided |
| D-2 | Administrator-only view | Decided |
| D-3 | No backend changes | Decided |
| D-4 | `/historial` is reachable by URL only; no link from the form page | Decided |
| OQ-2 | Is `X-Usuario-Rol: admin` enough in dev, or do we want a visible "viewing as admin" indicator? | Open |

---

## 9. Type filter (done)

The `tipo` filter was added to `GET /reportes` in a separate PR (merged to `main`), and this module now uses it for the type selector and the per-type totals.
