# Tareas: Migración del frontend web a AWS

- **Plan**: ./plan.md
- **Estado**: aprobado <!-- borrador | aprobado -->

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecha · `[!]` bloqueada · `[-]` descartada · `[P]` paralelizable

Formato de cada tarea (una línea):
`- [ ] T001 [P] Descripción imperativa — archivos: ruta/a, ruta/b — cubre: RF-001 — verifica: <comando o criterio observable>`

Dependencias: cada fase depende de la anterior; dentro de una fase se ejecuta en orden salvo `[P]`.
Dependencias explícitas: añadir `— depende: T00X`.

**Herramientas de verificación local** (Node instalado; sin `terraform`, `aws` ni `actionlint`; Podman con `podman machine start`):
- `$TF` = `podman run --rm -v "$PWD":/w -w /w docker.io/hashicorp/terraform:1.16.5` (`-chdir=infra/web init -backend=false`, `validate`, `test`; `fmt -check -recursive infra`)
- `actionlint`: `podman run --rm -v "$PWD":/repo -w /repo docker.io/rhysd/actionlint:1.7.7`
- `shellcheck`: `podman run --rm -v "$PWD":/mnt -w /mnt docker.io/koalaman/shellcheck:v0.10.0 scripts/*.sh`

## Fase 1: Preparación

- [x] T001 Versionar el arnés SDD, la constitución y la spec; ignorar `.sdd/activity.log`, `.claude/settings.local.json`, `.terraform/`, estados y `out/`; importar el protocolo en CLAUDE.md — archivos: .sdd/**, .claude/**, specs/001-migracion-aws/**, .gitignore, CLAUDE.md — cubre: — — verifica: `git status` limpio tras el commit y `.sdd/activity.log` ignorado

## Fase 2: Aplicación

- [x] T002 Añadir `urlApi()` con base `NEXT_PUBLIC_API_URL` (sin barra final; vacía → relativa), usarla en `obtenerJson`, `usuarios.ts` y `reportes/nuevo/page.tsx`, con pruebas — archivos: app/lib/api.ts, app/lib/api.test.ts, app/lib/usuarios.ts, app/reportes/nuevo/page.tsx — cubre: RF-002, RF-013, RNF-004 — verifica: `npm test` en verde (97 + nuevas) y `grep -rn 'fetch("/api' app` sin resultados fuera de pruebas
- [x] T003 Mover el detalle a `/historial/detalle/?id=` con `useSearchParams` en `<Suspense>`, actualizar el enlace de la tabla y adaptar sus pruebas — archivos: app/historial/detalle/page.tsx, app/historial/detalle/page.test.tsx, app/historial/[id]/ (eliminar), app/historial/components/TablaReportes.tsx — cubre: RF-004 — verifica: `npm test` en verde; prueba de «sin id» → «Reporte no encontrado»
- [x] T004 Configurar `next.config.ts` por fase (dev: rewrites; build: `output: "export"`, `trailingSlash: true`), eliminar `Dockerfile`, añadir `.env.example` — archivos: next.config.ts, Dockerfile, .env.example — cubre: RF-001, RF-005, RF-013 — verifica: `npm run lint && npm run build` genera `out/{index,mapa/index,historial/index,historial/detalle/index,reportes/nuevo/index,404}.html`; con `NEXT_PUBLIC_API_URL=https://ejemplo.invalid` la cadena aparece en `out/_next/static`; la config en fase dev devuelve 3 rewrites

## Fase 3: Infraestructura

- [x] T005 [P] Documentar el arranque (recursos reutilizados, política nueva `github-actions-urban-alert-web`, secreto y variable de GitHub) — archivos: infra/bootstrap/README.md, infra/bootstrap/github-web-policy.json — cubre: RF-012, RF-014 — verifica: JSON válido (`node -e 'JSON.parse(...)'`) y cada acción de CloudFront que usa el stack aparece en la política
- [x] T006 [P] Escribir la CloudFront Function de índice y su prueba — archivos: infra/web/funciones/indice.js, infra/web/funciones/indice.test.mjs — cubre: RF-005 — verifica: `node --test infra/web/funciones/indice.test.mjs` en verde
- [x] T007 Crear el stack `infra/web` (bucket privado, OAC, política del bucket, función, distribución, salidas) y su lock con 3 plataformas — archivos: infra/web/*.tf, infra/web/terraform.tfvars, infra/web/.terraform.lock.hcl — cubre: RF-006, RF-007, RNF-001, RNF-002 — verifica: `$TF fmt -check -recursive infra` y `$TF -chdir=infra/web validate` — depende: T006
- [x] T008 Escribir las pruebas de Terraform de las garantías (P7) — archivos: infra/web/tests/web.tftest.hcl — cubre: RF-005, RF-006, RF-007, RNF-002 — verifica: `$TF -chdir=infra/web test` en verde — depende: T007

## Fase 4: Integración

- [x] T009 Escribir `check-platform.sh` (solo `api-endpoint`), `publicar-sitio.sh` (2 sync + invalidación) y `smoke-web.sh` — archivos: scripts/check-platform.sh, scripts/publicar-sitio.sh, scripts/smoke-web.sh — cubre: RF-008, RF-009, RNF-001 — verifica: shellcheck sin avisos; `smoke-web.sh` contra `npx serve out` local en verde para las rutas
- [x] T010 Escribir el workflow Provision (test → plataforma → apply → build con SSM → publicar → smoke → resumen) — archivos: .github/workflows/provision.yml — cubre: RF-003, RF-008, RF-011, RF-012 — verifica: actionlint sin avisos
- [x] T011 [P] Escribir el workflow Deprovision con confirmación `urban-alert-web` — archivos: .github/workflows/deprovision.yml — cubre: RF-010, RF-011, RF-012 — verifica: actionlint sin avisos

## Fase 5: Pulido

- [x] T012 Reescribir el README (URL, arquitectura, costes, arranque, flujos, desarrollo local) y completar CLAUDE.md — archivos: README.md, CLAUDE.md — cubre: RF-014, RNF-003 — verifica: revisión; enlaces relativos existen
- [~] T013 Primer Provision en `main` (requiere: política aplicada por un administrador, secreto `AWS_ROLE_ARN` y variable `AWS_REGION` en el repo, y push autorizado por el usuario) — archivos: — — cubre: MS-001, MS-002 — verifica: workflow en verde; páginas cargan datos del gateway desde `site_url`
- [ ] T014 Segundo Provision sin cambios — cubre: MS-003 — verifica: `apply` informa 0 cambios — depende: T013
- [ ] T015 Deprovision + Provision (solo con autorización expresa del usuario) — cubre: MS-004, HU-4 — verifica: sin recursos `urban-alert-web` tras Deprovision; plataforma intacta — depende: T014

## Fase 6: Enmienda D-012 (CloudFront bloqueado hasta verificar la cuenta)

Aprobada por el usuario el 2026-10-11 («Let's use the lambda only»).

- [x] T016 Registrar la enmienda (spec §11, plan D-012, tareas) — archivos: specs/001-migracion-aws/* — cubre: — — verifica: revisión
- [x] T017 Escribir la función de origen y sus pruebas con un S3 falso — archivos: infra/web/origen/index.mjs, infra/web/origen/index.test.mjs — cubre: RF-005, RF-006, RNF-001, RNF-002 — verifica: `node --test infra/web/origen/index.test.mjs` en verde
- [x] T018 Añadir `cdn_habilitado` y los recursos de la Lambda (rol, logs, función, URL, permisos) a `infra/web`, salidas comunes y pruebas de ambas variantes; lock con el proveedor archive — archivos: infra/web/*.tf, infra/web/terraform.tfvars, infra/web/tests/web.tftest.hcl, infra/web/.terraform.lock.hcl — cubre: RF-005, RF-006, RF-007 — verifica: `$TF fmt -check`, `validate`, `test` — depende: T017
- [x] T019 Invalidación opcional en `publicar-sitio.sh`, pruebas del origen en el job test y documentación (README, CLAUDE.md, bootstrap, costes) — archivos: scripts/publicar-sitio.sh, .github/workflows/provision.yml, README.md, CLAUDE.md, infra/bootstrap/README.md — cubre: RF-008, RF-014 — verifica: shellcheck, actionlint, enlaces — depende: T018

## Correcciones de verificación

<!-- /sdd-verify añade aquí tareas si detecta fallos -->

## Cobertura

| Requisito | Tareas |
|---|---|
| RF-001 | T004, T013 |
| RF-002 | T002 |
| RF-003 | T010 |
| RF-004 | T003 |
| RF-005 | T004, T006, T008 |
| RF-006 | T007, T008 |
| RF-007 | T007, T008 |
| RF-008 | T009, T010 |
| RF-009 | T009 |
| RF-010 | T011 |
| RF-011 | T010, T011 |
| RF-012 | T005, T010, T011 |
| RF-013 | T002, T004 |
| RF-014 | T005, T012 |
| RNF-001 | T007, T009 |
| RNF-002 | T007, T008 |
| RNF-003 | T012 |
| RNF-004 | T002, T003 |
| D-012 (enmienda) | T016–T019 |
