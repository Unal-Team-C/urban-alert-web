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

## 2026-10-11 · 001-migracion-aws · T002 hecha
- urlApi() en app/lib/api.ts (NEXT_PUBLIC_API_URL literal para que Next la sustituya); obtenerJson, usuarios.ts y nuevo/page.tsx la usan. 101 tests en verde, eslint limpio. tsc sin build falla por PageProps/LayoutProps (tipos generados por next build; preexistente).

## 2026-10-11 · 001-migracion-aws · T003 hecha
- Detalle movido a app/historial/detalle (useSearchParams en Suspense; sin id → no encontrado sin llamar a la API). Enlace /historial/detalle?id= (next/link añade la barra con trailingSlash). 103 tests en verde. Las specs antiguas (historico-*) siguen citando /historial/[id]: son historia, no se tocan.

## 2026-10-11 · 001-migracion-aws · T004 hecha
- next.config.ts por fase: build → output export + trailingSlash (out/ con index.html por ruta y 404.html, 1,5 MB); dev → rewrites sin trailingSlash (comprobado con next dev: proxy a localhost:5039). NEXT_PUBLIC_API_URL aparece en out/_next/static. Dockerfile eliminado; .env.example. Gotcha: node no importa next.config.ts directamente (next/constants sin .js); next dev reescribe next-env.d.ts (revertir).

## 2026-10-11 · 001-migracion-aws · T005 hecha
- infra/bootstrap: README (reutiliza OIDC, rol, políticas deploy/platform y bucket de estado; clave web/terraform.tfstate) y github-web-policy.json (CloudFront sobre arn:aws:cloudfront::348364742283:*; List*/políticas gestionadas sobre *). JSON válido. Falta que un administrador la aplique antes de T013.
