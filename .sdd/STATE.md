# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 001-migracion-aws
fase: implement
tarea_actual: T006
estado_tarea: en_progreso

## Siguiente paso

T006: infra/web/funciones/indice.js (cloudfront-js-2.0, viewer-request: /x/ → /x/index.html; último segmento sin extensión → /index.html) + indice.test.mjs con node:test. Verifica: node --test infra/web/funciones/.

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- ninguno
