# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 001-migracion-aws
fase: implement
tarea_actual: T013
estado_tarea: en_progreso

## Siguiente paso

T013: push a main hecho (e4c350d, autorizado por el usuario); Provision run 38180467808 en curso. Revisar el resultado: si falla en configure-aws-credentials faltan AWS_ROLE_ARN/AWS_REGION (gh secret/variable list salieron vacíos); si falla con AccessDenied de CloudFront falta la política de infra/bootstrap. Si pasa: comprobar MS-001/MS-002 en site_url.

## Contexto de trabajo

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

## Bloqueos / preguntas abiertas

- T013: necesita política de CloudFront aplicada por un administrador, secreto/variable de GitHub y permiso de push.
- T015 (Deprovision + Provision) solo con autorización expresa.
