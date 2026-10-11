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

## 2026-10-11 · 001-migracion-aws · T006 hecha
- Función de índice (cloudfront-js-2.0) y 5 pruebas node:test en verde; eslint limpio (disable puntual: CloudFront invoca handler por nombre).

## 2026-10-11 · 001-migracion-aws · T007 hecha
- Stack infra/web: bucket urban-alert-web-<cuenta> privado (BPA, BucketOwnerEnforced, AES256, force_destroy), política solo cloudfront.amazonaws.com con AWS:SourceArn + deny sin TLS, OAC sigv4/always, función indice, distribución (PriceClass_100, http2and3, redirect-to-https, CachingOptimized, SecurityHeadersPolicy, 403/404 → /404.html 404). Lock aws 6.68.0 con 3 plataformas; validate y fmt OK (Podman, caché ~/.cache/tf-plugins).

## 2026-10-11 · 001-migracion-aws · T008 hecha
- web.tftest.hcl: 5 runs en verde (bucket privado, solo la distribución lee con AWS:SourceArn + deny sin TLS, HTTPS/OAC/certificado/cabeceras, función viewer-request y 403/404 → /404.html, prefijo). Gotchas: list == tuple siempre es false en HCL (usar toset); effect sin fijar es null con mock (se fija Allow en main.tf).

## 2026-10-11 · 001-migracion-aws · T009 hecha
- scripts check-platform.sh (imprime api-endpoint de SSM o falla), publicar-sitio.sh (2 sync + invalidación con wait), smoke-web.sh (páginas 200, ruta inexistente 404, URL del gateway en el JS, cabeceras de caché; --sin-cabeceras en local). shellcheck OK. Verificado con un emulador local de CloudFront (función indice + 404.html, en el scratchpad) sobre out/ con NEXT_PUBLIC_API_URL=https://ejemplo.invalid: smoke en verde y en rojo con otra URL; en el navegador las llamadas van a https://ejemplo.invalid/api/v1/..., la navegación de cliente (RSC .txt) funciona y el detalle sin id muestra no encontrado.

## 2026-10-11 · 001-migracion-aws · T010 hecha
- provision.yml: job test (Node 24: npm ci, lint, test, build; node --test; terraform fmt/validate/test; actionlint; shellcheck) y job provision (OIDC → check-platform imprime api_url → apply infra/web → build con NEXT_PUBLIC_API_URL → publicar-sitio → smoke → resumen). concurrency urban-alert-web-aws. actionlint OK.

## 2026-10-11 · 001-migracion-aws · T011 hecha
- deprovision.yml: confirmación urban-alert-web, solo main, destroy de infra/web (omite si el estado está vacío), comparte concurrency con Provision. actionlint OK.

## 2026-10-11 · 001-migracion-aws · T012 hecha
- README reescrito (arquitectura, URL desde site_url, workflows, caché, costes ~0 USD, arranque, desarrollo y validación local, limitaciones POST usuarios/CORS) y CLAUDE.md con estructura y gotchas. Enlaces relativos comprobados. Validación completa: lint, 103 tests, build, 5 pruebas de la función.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada
- T001–T012 hechas y commiteadas en local (sin push). T013 espera al usuario: política de CloudFront (administrador), AWS_ROLE_ARN/AWS_REGION en GitHub y push a main.

## 2026-10-11 · 001-migracion-aws · T013 push
- Push de main (66679bb..e4c350d) autorizado por el usuario. Provision run 38180467808.

## 2026-10-11 · 001-migracion-aws · T013 corrección
- Run 38180467808 falló en el job test: `node --test infra/web/funciones/` en Node 24 trata la carpeta como módulo (MODULE_NOT_FOUND); local (Node 26) pasaba. Se pasa el archivo indice.test.mjs en workflow, README, CLAUDE.md y plan. Nada se tocó en AWS.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada en permisos
- Run 38180550392: tests en verde (incluido Terraform, actionlint, shellcheck en CI), OIDC y check-platform OK; terraform apply falla al leer data.aws_cloudfront_response_headers_policy: AccessDenied en ListResponseHeadersPolicies. La política de infra/bootstrap aún no está adjunta. Sin recursos creados.

## 2026-10-11 · 001-migracion-aws · T013 rerun
- Usuario: política github-actions-urban-alert-web adjunta. Rerun del job fallido del run 38180550392.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada por verificación de cuenta
- Rerun del run 38180550392 con la política adjunta: IAM correcto; se crearon bucket (+BPA, ownership, SSE), OAC y función. CreateDistributionWithTags → 403 «Your account must be verified before you can add new CloudFront resources» (RequestID ddf2a519-094f-49a5-88c6-8f196c739737). Requiere caso en AWS Support; no hay cambio de IAM ni de código que lo resuelva.

## 2026-10-11 · 001-migracion-aws · T016 hecha
- Enmienda D-012 registrada: CloudFront bloqueado por verificación de cuenta → Lambda function URL sobre el bucket privado, sin WAF, conmutada por cdn_habilitado. Aprobada por el usuario («Let's use the lambda only»). WAF descartado (no admite function URLs ni HTTP APIs).

## 2026-10-11 · 001-migracion-aws · T017 hecha
- Origen Lambda (infra/web/origen/index.mjs): crearHandler(leer) con índices, tipos (corrige binary/octet-stream), caché, ETag/304, 404.html, 405, HEAD, cabeceras de seguridad; adaptador S3 con import dinámico del SDK del runtime (403/404 → 404). 10 pruebas node:test en verde, eslint limpio.

## 2026-10-11 · 001-migracion-aws · T018 hecha
- infra/web: cdn_habilitado=false y concurrencia_reservada=-1 en tfvars; CloudFront con count y moved (OAC y función existentes se eliminarán en el próximo apply); lambda.tf (rol con políticas en línea, log group 30 días, archive_file → .build/origen.zip ignorado, nodejs22.x arm64 256 MB, function URL NONE, permisos InvokeFunctionUrl + InvokeFunction con invoked_via_function_url); salidas según variante. Lock con archive 2.8.1. 8 runs de terraform test en verde, fmt/validate OK.

## 2026-10-11 · 001-migracion-aws · T019 hecha
- publicar-sitio.sh sin invalidación con distribución vacía; job test ejecuta las pruebas del origen; README (estado temporal, arquitectura Lambda, costes, cómo volver a CloudFront), CLAUDE.md (gotchas de function URL y políticas en línea), bootstrap (política multimedia verificada en su README: mismo rol; Multimedia ya sufrió el mismo bloqueo de CloudFront, su D-015). shellcheck, actionlint, 15 pruebas node y enlaces OK.

## 2026-10-11 · 001-migracion-aws · T013 push con origen Lambda
- Usuario: «push it». Push de main con T013 (estado) y T016–T019.
