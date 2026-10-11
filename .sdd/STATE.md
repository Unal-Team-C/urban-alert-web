# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 001-migracion-aws
fase: implement
tarea_actual: T013
estado_tarea: bloqueada

## Siguiente paso

T013 bloqueada: run 38180550392 pasó tests, OIDC y plataforma, y falló en terraform apply con AccessDenied en cloudfront:ListResponseHeadersPolicies (la política github-actions-urban-alert-web no está adjunta al rol). Nada se creó. Cuando un administrador aplique infra/bootstrap/github-web-policy.json: `gh run rerun 38180550392 --repo Unal-Team-C/urban-alert-web` y verificar MS-001/MS-002 en site_url.

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- T013: falta adjuntar la política de CloudFront al rol de GitHub (administrador). Secreto/variable de GitHub ya funcionan.
- T015 (Deprovision + Provision) solo con autorización expresa.
