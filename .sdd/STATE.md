# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 001-migracion-aws
fase: implement
tarea_actual: T021
estado_tarea: en_progreso

## Siguiente paso

T021: cdn_habilitado = true (cuenta verificada para CloudFront, dicho por el usuario 2026-10-12); runs de la Lambda en web.tftest.hcl con cdn_habilitado = false explícito; docs. Commit local; push solo con permiso (cambia la URL). Después: /sdd-new 002 (rediseño UI: mapa a pantalla completa, barra superior con logo y Crear reporte, panel lateral derecho con el detalle, botón volver al mapa en el formulario).

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- T015 (Deprovision + Provision) solo con autorización expresa.
