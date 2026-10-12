# Tareas: Rediseño del mapa como vista principal

- **Plan**: ./plan.md
- **Estado**: aprobado <!-- borrador | aprobado -->

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecha · `[!]` bloqueada · `[-]` descartada · `[P]` paralelizable

Verificación de cada tarea: `npm run lint && npm test && npm run build` además de lo indicado.

## Fase 1: Piezas

- [x] T001 [P] Logo en `public/` y `BarraSuperior` con pruebas — archivos: public/logo-urbanalert.png, app/components/BarraSuperior.tsx, app/components/BarraSuperior.test.tsx — cubre: RF-001 — verifica: pruebas del logo enlazado a `/` y de los hijos
- [~] T002 [P] Última vista del mapa (`guardarUltimaVista`, `hrefUltimaVista`) con pruebas — archivos: app/lib/vistaMapa.ts, app/lib/vistaMapa.test.ts — cubre: RF-012 — verifica: pruebas con y sin `localStorage` y con valor inválido
- [ ] T003 `PanelDano` (sustituye a `DetalleDano`): campos, «Reportado por», «Ver en el histórico», estados, cerrar con botón y Esc, foco — archivos: app/mapa/components/PanelDano.tsx, app/mapa/components/PanelDano.test.tsx, app/mapa/components/DetalleDano.tsx (borrar), app/mapa/components/DetalleDano.test.tsx (borrar) — cubre: RF-005, RF-007, RF-008, RF-009, RNF-001 — verifica: pruebas del panel

## Fase 2: Mapa

- [ ] T004 `MapaDanos`: `seleccionado`/`onSeleccionar`, punto resaltado dibujado al final, sin `Popup`, `AjustarTamano` (ResizeObserver + invalidateSize + panTo del seleccionado) — archivos: app/mapa/components/MapaDanos.tsx — cubre: RF-002, RF-006 — verifica: lint/test/build; navegador en T007
- [ ] T005 `VistaPrincipal` y pantallas `/` y `/mapa` (barra + mapa + panel responsive, foco al cerrar, guardar última vista) — archivos: app/components/VistaPrincipal.tsx, app/page.tsx, app/page.test.tsx, app/mapa/page.tsx, app/mapa/layout.tsx — cubre: RF-001, RF-002, RF-003, RF-004, RF-010, RNF-002 — verifica: page.test (barra, sin iframe) — depende: T001–T004

## Fase 3: Formulario

- [ ] T006 Barra con «Volver al mapa» (última vista) y botón de usuario en el formulario; enlace «Volver al mapa» en la confirmación — archivos: app/reportes/nuevo/page.tsx, app/reportes/nuevo/page.test.tsx, app/components/ReporteCreadoModal.tsx, app/components/ReporteCreadoModal.test.tsx — cubre: RF-011, RF-012, RF-013 — verifica: pruebas de ambos enlaces — depende: T001, T002

## Fase 4: Verificación y publicación

- [ ] T007 Verificar en navegador con `next dev` contra el gateway, en 1440 × 900 y 375 × 812, la lista del plan §9 — cubre: MS-001, MS-002, MS-003, RF-002, RF-006, RF-010 — verifica: capturas y notas en el journal
- [ ] T008 [P] Documentación: nota en `specs/mapa-functional-spec.md` (US-M04 y US-M06 sustituidas) y README — archivos: specs/mapa-functional-spec.md, README.md — cubre: — — verifica: revisión
- [ ] T009 Publicar (push con permiso) y repetir MS-001/MS-002/MS-003 en el sitio — verifica: Provision en verde y comprobación en el navegador

## Cobertura

| Requisito | Tareas |
|---|---|
| RF-001 | T001, T005 |
| RF-002 | T004, T005, T007 |
| RF-003 | T005 |
| RF-004 | T005 |
| RF-005 | T003 |
| RF-006 | T004, T007 |
| RF-007 | T003, T005 |
| RF-008 | T003 |
| RF-009 | T003 |
| RF-010 | T005, T007 |
| RF-011 | T006 |
| RF-012 | T002, T006 |
| RF-013 | T006 |
| RNF-001 | T003 |
| RNF-002 | T005 |
