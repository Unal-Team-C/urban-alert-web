# Journal SDD

<!-- Bitácora append-only: añade entradas AL FINAL, no reescribas las anteriores.
     Formato:
     ## AAAA-MM-DD · <feature o "general"> · <evento>
     - detalle (qué, por qué, archivos, verificación)
     Las horas exactas de cada edición/checkpoint quedan en .sdd/activity.log. -->

## 2026-10-11 · general · arnés instalado
- Copiado de `urban-alert-plataforma` (las carpetas .sdd/.claude llegaron vacías). STATE y journal reiniciados.
- Constitución 1.0.0 adaptada de `urban-alert-usuarios` al frontend estático (P1–P10).

## 2026-10-11 · 001-migracion-aws · spec, plan y tareas en borrador
- Decisión del usuario: sitio estático en S3 + CloudFront (no servidor Next).
- URL del gateway: SSM `api-endpoint` → `NEXT_PUBLIC_API_URL` en el build (D-002); detalle a `/historial/detalle/?id=` (D-003).
- Hallazgo: `POST /api/v1/usuarios` es AWS_IAM en el gateway → 403 desde el navegador (aceptado en la spec de Usuarios; fuera de alcance).
- Hallazgo: el rol de GitHub no tiene permisos de CloudFront → política nueva en infra/bootstrap (D-010).

## 2026-10-11 · 001-migracion-aws · aprobación
- El usuario aprueba spec, plan y tareas («Approved, go ahead with the implementation»). Fase implement.

## 2026-10-11 · 001-migracion-aws · T001 hecha
- Arnés, constitución 1.0.0 y spec/plan/tareas versionados; .gitignore con activity.log, settings.local.json, Terraform; CLAUDE.md importa AGENTS.md y el protocolo.
