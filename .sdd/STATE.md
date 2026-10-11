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

T013 bloqueada por AWS: la cuenta debe verificarse para crear recursos de CloudFront (AccessDenied en CreateDistributionWithTags, RequestID ddf2a519-094f-49a5-88c6-8f196c739737). El usuario abre caso en AWS Support. Después: `gh run rerun 38180550392 --repo Unal-Team-C/urban-alert-web --failed` (o un push), revisar log y verificar MS-001/MS-002 en site_url.

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- T013: verificación de la cuenta por AWS Support para CloudFront. Ya creados (en el estado): bucket urban-alert-web-348364742283 con BPA/ownership/SSE, OAC EXJOOM023J37H, función urban-alert-web-indice. Falta distribución y política del bucket.
- Alternativa sin CloudFront (S3 website, HTTP y bucket público) incumple RF-006/RF-007: solo con cambio de spec.
- T015 (Deprovision + Provision) solo con autorización expresa.
