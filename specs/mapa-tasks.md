# Tasks — Damage Map (Frontend)

Each task is small and verifiable. `lint` = `npx eslint app`, `build` = `npm run build`, `test` = `npm test`.

| # | Task | Done when |
|---|---|---|
| 1 | Move `useCarga` to `app/lib/useCarga.ts`, update `/historial` imports | existing tests pass; lint |
| 2 | `lib/geoespacial.ts`: `DanoCercano`, `listarCercanos(centro, radio, signal)` | unit test: URL and query string, error mapping |
| 3 | `lib/celdas.ts`: `ladoParaZoom`, `celdasVisibles`, `enCelda`, `ancestros` | unit tests for the invariants in technical spec §8 |
| 4 | `scripts/localidades_geojson.py` → `public/localidades.geojson`; `lib/localidades.ts` | unit tests: point in polygon, known places, totals; script output checked against the original polygons |
| 5 | `lib/vistaMapa.ts`: `leerVista`, `escribirVista` | unit tests: valid, invalid, out of Bogotá, zoom clamp |
| 6 | `mapa/useDanosVisibles.ts` (view + whole areas, `estadoDe`) | hook tests: cache/TTL, ancestor reuse, partial failure + retry, no repeat after leaving the view, abort on unmount, areas |
| 7 | `mapa/components/DetalleDano.tsx` | component tests: loading, data, 404, error + retry |
| 8 | `mapa/components/MapaDanos.tsx` (localidad outlines + bubbles, points, popup, view events, attribution) | lint + build |
| 9 | `mapa/layout.tsx`, `mapa/page.tsx` (URL, header, banner, empty state) | lint + build |
| 10 | `next.config.ts`: dev rewrite for `/api/v1/geoespacial/reports` | `npm run dev` + Geoespacial on :8000 returns points |
| 11 | Move the form to `app/reportes/nuevo/page.tsx` (imports only) | `/reportes/nuevo` renders the form unchanged; lint + build |
| 12 | Welcome page `app/page.tsx` with the map iframe and the "Crear reporte" button | component test: link to `/reportes/nuevo`, iframe to `/mapa`; lint + build |
| 13 | Manual pass against the compose gateway with real reports | checklist in `mapa-verify.md` |
