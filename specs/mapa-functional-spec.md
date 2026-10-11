# Functional Specification — UrbanAlert Damage Map (Frontend)

**Version:** 0.1.0 (draft)
**Date:** 2026-10-09
**Author:** UrbanAlert Team C
**Status:** Draft — pending review
**Owner:** Fabian ("Map views", per *Contratos UrbanAlert*)

---

## 1. Overview

The **Damage Map** is a new view **inside the existing Next.js app** (`frontend/reportes-front`, route `/mapa`). It shows on a map of Bogotá the damage reports located in the area the user is looking at. When the map is zoomed out, damages are grouped by **localidad**: each localidad is outlined and shows one bubble with its total number of damages; once the user zooms in to street level, each damage is drawn as its own point, and clicking a point shows the damage's information.

The points come from the Geoespacial service (`GET /api/v1/geoespacial/reports`, reports near a point within a radius). The information of a clicked damage comes from Reportes. The view is a **read-only consumer** reached through the gateway; it owns no data and **does not change the backend**.

The app's entry point changes with it: `/` becomes a **welcome page** that embeds the map (`/mapa` in an internal iframe) and has a button to the report form, which moves from `/` to its own route `/reportes/nuevo` without visual changes.

### Scope

| In scope | Out of scope |
|---|---|
| Map of Bogotá with the damages of the visible area | Filtering by state ("open only"), see §7.1 |
| Area queried derived from the viewport and zoom level | Filtering by category, type or level |
| One bubble per localidad with its total, and localidad outlines, when zoomed out | Creating, editing or deleting reports |
| Individual points from street-level zoom | Works (Obras service) |
| Damage information on click | Heat maps, routes, real-time push |
| Loading / partial error / empty states | Backend changes |
| Welcome page at `/` with the embedded map and a button to the form | Changing the form's behaviour or styles |
| Form moved to `/reportes/nuevo` | |

---

## 2. Actors

| Actor | Can do |
|---|---|
| **Any user** (citizen, gestor, administrator) | Everything in this view |

There is no login yet (see the history spec §7.6). The view shows only data that the gateway already publishes without restriction.

---

## 3. User Stories

### US-M01 — See the damages of the area I am looking at
**As a** user, **I want to** see the damages located in the visible area of the map, **so that** I know what is happening around a place.

Acceptance criteria:
- The map opens centred on Bogotá at a city-wide zoom level and cannot be panned outside Bogotá (same limits as the location picker of the form).
- The damages shown are those Geoespacial returns for the visible area. The area queried depends on the viewport and the zoom level: the closer the zoom, the smaller the radius requested.
- Moving or zooming the map updates the damages once the movement ends, without reloading the page.
- An indicator shows while damages are loading. The map stays usable meanwhile.
- If the area has no damages, the map says so ("No hay daños reportados en esta zona").

### US-M02 — Damages per localidad when zoomed out
**As a** user, **I want** to see how many damages each localidad has when the map is zoomed out, **so that** I can compare areas of the city without thousands of overlapping points.

Acceptance criteria:
- Below the street-level zoom (`ZOOM_PUNTOS`, 15 in Leaflet/OpenStreetMap terms), damages are never drawn individually.
- Every localidad that touches the visible area is drawn with a thin outline; hovering over it shows its name.
- Each of those localidades shows one bubble, at a point inside it, with the **total** number of damages of the whole localidad, including the part outside the screen. While part of the localidad is still loading, the bubble shows "…"; a localidad with no damages shows 0 in gray.
- The bubble size grows with the count, so localidades with more damages stand out. Hovering a bubble shows "<localidad>: N daños".
- Damages located outside every localidad (the Bogotá range that Geoespacial accepts also covers parts of neighbouring municipalities) are not counted in any bubble; they still show as points from `ZOOM_PUNTOS`.
- Clicking a bubble zooms to fit the localidad (at most to `ZOOM_PUNTOS`).
- Localidad boundaries: *Localidad. Bogotá D.C.*, Secretaría Distrital de Planeación, Datos Abiertos Bogotá, CC BY 4.0. The map shows this attribution.

### US-M03 — Individual points at street level
**As a** user, **I want to** see each damage as its own point once the streets are visible, **so that** I can see exactly where each one is.

Acceptance criteria:
- From `ZOOM_PUNTOS` (15) inward, each damage is drawn as a point at its coordinate.
- Zooming out again below `ZOOM_PUNTOS` switches back to bubbles.

### US-M04 — See a damage's information
**As a** user, **I want to** click a point and see the information of that damage.

Acceptance criteria:
- Clicking a point opens a popup anchored to it.
- The popup shows: category and type (catalog names), description, state, emergency level, date (`America/Bogota`), image (if any) and coordinates.
- The information is requested when the point is clicked, not before.
- While it loads, the popup shows a loading message. If Reportes answers 404 (the coordinate has no report, e.g. Geoespacial seed data), the popup says "No hay un reporte registrado para este punto". Any other failure shows the error and a retry button, inside the popup only.

### US-M05 — Shareable view
**As a** user, **I want** the URL to reflect the map position, **so that** I can share or reload the same view.

Acceptance criteria:
- The URL keeps `?lat=&lon=&zoom=` up to date as the map moves (replacing the history entry, not adding one per movement).
- Opening `/mapa` with those parameters opens the map there. Invalid or out-of-Bogotá values are ignored and the default view is used.

### US-M06 — Welcome page
**As a** user, **I want** the app to open on a welcome page that shows the damage map and lets me create a report, **so that** I see what is already reported before reporting something new.

Acceptance criteria:
- `/` shows a welcome title and text, the damage map embedded in an iframe (`/mapa`, same origin) and a "Crear reporte" button.
- The button takes the user to `/reportes/nuevo`.
- Everything in US-M01–M04 works inside the iframe (zoom, bubbles, points, popups).
- Uses the same visual language as the form: gray background, white rounded card with shadow, bold title, gray helper text, black primary button.

### US-M07 — Report form on its own route
**As a** user, **I want** the report form at its own address.

Acceptance criteria:
- The form lives at `/reportes/nuevo` and looks and behaves exactly as it did at `/`.
- `/historial` and its links are not affected.

---

## 4. Business Rules

| ID | Rule |
|---|---|
| BR-01 | The view never mutates reports or locations. |
| BR-02 | Every request to Geoespacial uses a centre inside the Bogotá range (3.72..4.84, −74.46..−73.98) and `0 < radius ≤ 6000` m; otherwise Geoespacial answers 400. |
| BR-03 | The damages of an area are counted once even if the area is covered by several requests; each damage counts for at most one localidad. |
| BR-04 | Below `ZOOM_PUNTOS` (15) damages are only shown aggregated by localidad; from 15 inward, only individually. |
| BR-05 | Dates are displayed in `America/Bogota`. |
| BR-06 | Results for an area are reused for up to 60 s; after that, moving over the area requests it again, so the map reflects the current state. |

---

## 5. Consumed API Contract

| Purpose | Endpoint | Service |
|---|---|---|
| Damages near a point | `GET /api/v1/geoespacial/reports?lat&lon&radius` → `[{reportId, coordinateId, coordinate:{lat,lon}}]`, nearest first | Geoespacial (GET only through the gateway) |
| Damage information | `GET /api/v1/reportes/{id}` → `ReporteDto` / 404 | Reportes |
| Catalog labels | `GET /api/v1/reportes/catalogo` | Reportes |

Geoespacial errors: `400 {code, message, details?}` for invalid parameters or a centre outside Bogotá, `503` when its database is down. It returns `[]` for an area without reports and does not page or cap the results.

---

## 6. Error Catalog (UI behaviour)

| Condition | UI |
|---|---|
| Some area requests fail (5xx / network) | Damages that did load are shown; a banner says "No se pudieron cargar los daños de parte del mapa" with a retry button |
| All area requests fail | Same banner; the map stays usable |
| Popup: Reportes 404 | "No hay un reporte registrado para este punto" |
| Popup: other error | Message + retry, inside the popup |

---

## 7. Known Gaps and Constraints

None are fixed by this view (no backend changes).

1. **No "open only" filter.** The original request is to show the damages that are open right now. Geoespacial returns `{reportId, coordinateId, coordinate}` without the report's state, and Reportes cannot be queried by a list of ids, so the map shows every located report regardless of state. The state is visible in the popup. Fixing it needs a backend change (OQ-1).
2. **Max radius 6000 m.** A zoomed-out view of Bogotá is larger than one circle of 6 km, so the area is covered with several requests (technical spec §5). The cost grows with the visible area; the minimum zoom is limited so that it stays bounded.
3. **No server-side aggregation.** Totals per localidad are computed in the browser from every point of each visible localidad, so a localidad is downloaded whole even if only a corner of it is on screen. With the Geoespacial seed (≈20 000 points) a city-wide view downloads ~6 MB the first time. Sumapaz is very large: when it is visible, its ~60 cells are requested. A count-per-localidad endpoint in Geoespacial (PostGIS `ST_Contains` against the same polygons) would be better if volumes grow.
6. **Simplified boundaries.** Polygons are simplified to ~5 m so the file is small (153 KB); a damage within a few metres of a boundary may be counted in the neighbouring localidad (0.03 % of points in a uniform sample).
4. **Seed data without reports.** The Geoespacial seed (31 demo + 20 000 synthetic points, invented `reportId`s) is only loaded by the service's own compose, for its load tests. The UrbanAlert compose (`infrastructure/`) mounts only `schema.sql`, so the map shows the locations of real reports. A point without a report (e.g. with the service's own compose) shows the 404 message (US-M04).
5. **OpenStreetMap public tiles**, same as the form: attribution required, moderate use only.

---

## 8. Decisions and Open Questions

| ID | Decision / Question | Status |
|---|---|---|
| D-1 | Same app (`reportes-front`), new route `/mapa`, branch `geoespacial-frontend` from `main` | Decided |
| D-2 | Points come only from `GET /api/v1/geoespacial/reports` | Decided |
| D-3 | No backend changes | Decided |
| D-4 | Street-level threshold `ZOOM_PUNTOS = 15`; bubbles below it | Proposed |
| D-7 | Aggregation by localidad (official SDP shapefile) instead of a screen grid; bubbles show the whole localidad's total; outlines drawn below `ZOOM_PUNTOS` | Decided |
| D-5 | `/` is a welcome page with `/mapa` in an internal iframe and a button to the form; the form moves to `/reportes/nuevo` with identical styles. `/mapa` also works on its own | Decided |
| D-6 | Visible to any user | Proposed |
| OQ-1 | "Open only": add state to Geoespacial (events from RabbitMQ), or a batch query in Reportes (`ids` + `estados`)? | Open — not now |
