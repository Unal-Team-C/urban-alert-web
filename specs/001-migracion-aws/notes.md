# Notas de 001-migracion-aws

## Contexto aparcado (2026-10-12, al iniciar 002-rediseno-mapa)

- T021 (volver a CloudFront) commiteada en local, pendiente de push con permiso del usuario; al hacerlo, Provision crea la distribución, elimina la Lambda y la URL del sitio pasa a *.cloudfront.net. Verificar smoke y el navegador en la nueva site_url.
- Pendiente: /sdd-verify (verify.md); T015 solo con autorización expresa.

- Arnés copiado de `../../Plataforma compartida AWS` (hooks en powershell, no instalado en este Mac: protocolo a mano).
- Referencias: `../../Microservicio usuarios` (workflows, bootstrap, tests con mock_provider), `../../Plataforma compartida AWS` (contrato SSM, docs/integracion.md, CORS `*` en el gateway).
- Baseline: `npm ci && npx vitest run` → 18 archivos, 97 tests en verde.
- Next 16: leer `node_modules/next/dist/docs/01-app/02-guides/static-exports.md` (rewrites no se admiten con `output: export`, ni siquiera en `next dev`).

### Bloqueos

- T015 (Deprovision + Provision) solo con autorización expresa.
