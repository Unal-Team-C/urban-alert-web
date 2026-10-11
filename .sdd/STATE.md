# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 001-migracion-aws
fase: implement
tarea_actual: T009
estado_tarea: en_progreso

## Siguiente paso

T009: scripts/check-platform.sh (api-endpoint en SSM), scripts/publicar-sitio.sh <dir> <bucket> <distribution> (sync _next/static immutable sin --delete; resto max-age=0 con --delete; invalidación /* y wait), scripts/smoke-web.sh <site_url> <api_url> (200 en /, /mapa/, /historial/, /historial/detalle/?id=x, /reportes/nuevo/; 404 en ruta inexistente; JS contiene api_url; cabeceras de caché). Verifica: shellcheck y smoke contra servidor local de out/.

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- ninguno
