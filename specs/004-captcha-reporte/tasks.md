# Tareas: Verificación humana (captcha) en el formulario de nuevo reporte

- **Plan**: ./plan.md
- **Estado**: aprobado <!-- borrador | aprobado -->

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecha · `[!]` bloqueada · `[-]` descartada · `[P]` paralelizable

## Fase 1: Núcleo

- [x] T001 `app/lib/turnstile.ts` (carga única del script, tipos mínimos de la API explícita y clave del build) con pruebas — archivos: app/lib/turnstile.ts, app/lib/turnstile.test.ts — cubre: RF-007, RNF-001 — verifica: `npm test` en verde
- [x] T002 Componente `VerificacionHumana` (render explícito con acción crear-reporte y tema auto, callbacks de token, vencimiento y error, `reiniciar()` por ref, estado de error de carga) con pruebas — archivos: app/components/VerificacionHumana.tsx, app/components/VerificacionHumana.test.tsx — depende: T001 — cubre: RF-001, RF-005, RF-006, RNF-003 — verifica: `npm test` en verde
- [x] T003 Integrar en el formulario: token en el estado, botón deshabilitado con texto aria-live, `captchaToken` en el FormData, reinicio tras error conservando los datos y sin cambios si no hay clave; pruebas del formulario — archivos: app/reportes/nuevo/page.tsx, app/reportes/nuevo/page.test.tsx — depende: T002 — cubre: RF-002, RF-003, RF-004, RF-007 — verifica: `npm run lint && npm test && npm run build` en verde

## Fase 2: Integración

- [x] T004 Workflow: `NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.TURNSTILE_SITE_KEY }}` en el build de Provision — archivos: .github/workflows/provision.yml — cubre: RNF-002, D-002 — verifica: actionlint limpio
- [x] T005 Comprobación en el navegador con `next dev` y la clave de prueba: widget visible y en tema claro y oscuro, botón deshabilitado hasta tener token, envío con token y, contra Reportes local con la 003 activa y el secreto de prueba, reporte creado (201) — archivos: — — depende: T003 — cubre: MS-001, RNF-003 — verifica: capturas en el journal y respuesta 201 en las peticiones de red

## Fase 3: Pulido

- [x] T006 Documentar: activación (crear el widget en Cloudflare con los dominios, variable `TURNSTILE_SITE_KEY`, orden respecto a Reportes), desarrollo local con la clave de prueba — archivos: README.md, CLAUDE.md — cubre: D-002 — verifica: revisión cruzada con el workflow y el código
- [ ] T007 Comprobación completa: lint, test, build y actionlint; diff sin `infra/` — cubre: P6 — verifica: todo en verde

## Correcciones de verificación

<!-- /sdd-verify añade aquí tareas si detecta fallos -->

## Cobertura

| Requisito | Tareas |
|---|---|
| RF-001 | T002 |
| RF-002 | T003 |
| RF-003 | T003 |
| RF-004 | T003 |
| RF-005 | T002 |
| RF-006 | T002 |
| RF-007 | T001, T003 |
| RNF-001 | T001 |
| RNF-002 | T004 |
| RNF-003 | T002, T005 |
