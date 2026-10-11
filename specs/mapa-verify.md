# Verification — Damage Map

## Automated (run from `frontend/reportes-front`)

| Check | Command | Result |
|---|---|---|
| Unit + hook + component tests | `npm test` | 97 passed (18 files) |
| Lint | `npx eslint app` | clean |
| Production build | `npm run build` | compiles; `/`, `/mapa`, `/reportes/nuevo`, `/historial`, `/historial/[id]` generated |

## Localidades data

| Check | Result |
|---|---|
| `scripts/localidades_geojson.py` on the SDP shapefile (20 polygons, 57 840 vertices) | 6 944 vertices, 153 KB |
| Simplified vs original polygons, 20 000 uniform points over the urban area | 6 assigned differently (0.03 %), all next to a boundary |
| Every label point inside its localidad | OK (script check and unit test) |
| Dataset licence (portal API) | CC BY 4.0, Secretaría Distrital de Planeación; attribution shown on the map |

## Manual against the compose gateway

Stack: `cd infrastructure && GATEWAY_PORT=8088 docker compose up -d --build` with Podman, checked in the desktop app's browser. Data: Geoespacial seed (≈20 000 points, no reports behind them) plus 3 reports created through the gateway in Chapinero (multipart with image; one moved to `VERIFICADO`, level `ALTA`).

| Check | Result |
|---|---|
| `/` welcome page: title, map iframe (`/mapa`), "Crear reporte" → `/reportes/nuevo` | OK |
| `/reportes/nuevo` form: same look as before at `/` | OK |
| Zoom 12: outline + one bubble per visible localidad, attribution | OK (19 localidades) |
| Bubble totals = whole localidad | OK: compared with an independent count (all of Bogotá queried directly from Geoespacial with other circles, points assigned with the **original** shapefile polygons). 11 localidades equal, 8 differ by ±1 (8 of ~15 000 points, boundary simplification) |
| Points outside every localidad not counted | OK: 4 663 seed points fall in neighbouring municipalities inside the Bogotá range |
| Bubble click → fit the localidad (Chapinero → zoom 13) | OK |
| Totals stay right while panning into new localidades | **Bug found and fixed** (reported by the user: counters did not follow the map): each point's localidad was cached after being computed against the *visible* localidades only, so a point first seen while its localidad was off screen stayed "no localidad" (Kennedy showed 89 instead of 1 063, Puente Aranda 0). Points are now assigned against all 20 localidades and the cache is per list (regression test). Re-checked panning from Suba to Kennedy: Kennedy 1 063, Teusaquillo 385, as in the independent count |
| Bubble tooltip text follows the count ("Suba: 2.249 daños") | **Bug found and fixed**: react-leaflet does not update a marker's `title`; the text now lives in the icon |
| Requests per view: initial city view 31 cells, 31 requests | **Bug found and fixed**: first 48 requests for 31 cells. Two causes: aborting cells that left the view (now they finish into the cache) and a race where a cell left the in-flight set before its result was in state (now tracked by request number) |
| View with Sumapaz (south, zoom 12): 66 requests, all distinct | As expected (functional §7.3) |
| Zoom 18: individual points; popup of a real report with catalog names, state, level, date, coordinates | OK |
| Popup width | **Bug found and fixed**: Leaflet sized the popup for "Cargando…" and the content overflowed; all states now share a fixed width, and `<p>` margins from Leaflet are avoided |
| Seed point → "No hay un reporte registrado para este punto." | OK |
| URL keeps `?lat&lon&zoom` (5 decimals) and opens there | OK |

Not exercised in a browser: the failed-cell banner and retry, the localidades load error banner, and TTL expiry. These are covered by hook tests only.

## Seed data removed from the UrbanAlert compose

`infrastructure/docker-compose.yml` now mounts only `db/schema.sql` into `geoespacial-db`, so a new volume starts empty (`01_init.sh` skips a missing `seed.sql`). The service's own `compose.yaml` still loads the seed for its load tests.

| Check | Result |
|---|---|
| New volume without the seed (throwaway container, same image and mounts) | init script runs, `coordinates` has 0 rows |
| Existing local volume: seed rows deleted with the seed's own formulas (`md5('demo-'‖name)`, `md5('synthetic-'‖i)`), in a transaction that required exactly 20 031 rows | 20 031 deleted; the 3 points of the real reports remain |
| Map after the cleanup | "3 daños en esta zona"; Chapinero 2, Barrios Unidos 1, the rest 0. The Barrios Unidos one is 81 m inside that localidad in the original polygon |

## Environment notes (not part of this change)

Running the compose with **Podman** needed three local workarounds. None of them is committed:
- The gateway uses `resolver 127.0.0.11` (Docker's DNS). Podman's DNS is at the network gateway, so nginx answered 502. A compose override with Podman's resolver IPs was mounted for the test.
- RabbitMQ failed with `.erlang.cookie: eacces` on a new volume (rootless ownership). Fixed by changing the owner inside the Podman VM.
- `next build` and the Usuarios Gradle build were killed for lack of memory in the 2 GiB Podman VM while the stack ran. Images were built with the stack stopped.
