# Tasks — Report History (Frontend)

Each task is small and verifiable. `lint` = `npm run lint`, `build` = `npm run build`, `test` = `npm test`.

| # | Task | Done when |
|---|---|---|
| 1 | Add Vitest + Testing Library + jsdom, `test` script, config | `npm test` runs an empty suite |
| 2 | `lib/api.ts`: fetch wrapper and `ApiError`; refactor `leerError` use only if trivial | unit tests for error mapping |
| 3 | `lib/formato.ts`: date in `America/Bogota`, short id | unit tests |
| 4 | `lib/reportes.ts` (types, `listarReportes`, `obtenerReporte`, `contarPor`) + `lib/catalogo.ts` | unit tests with mocked fetch |
| 5 | `lib/auditoria.ts`, `lib/geoespacial.ts`, `listarUsuarios` in `lib/usuarios.ts` | unit tests with mocked fetch |
| 6 | `Estados.tsx` (Loading / Empty / Error+retry) | component test |
| 7 | `TotalesGrid.tsx` | test: exact totals, failed card shows "—" |
| 8 | `FiltrosHistorial.tsx` + URL state, `TablaReportes.tsx` + pager, `/historial/page.tsx` | test: filter change resets page; lint + build |
| 9 | `LineaDeTiempo.tsx`, `VerificacionIntegridad.tsx` | test: one event, load more, valid/altered |
| 10 | `DetalleReporte.tsx`, `/historial/[id]/page.tsx` | test: 404, independent section failures; lint + build |
| 11 | Manual pass against compose gateway with real data | checklist in `historico-verify.md` |
