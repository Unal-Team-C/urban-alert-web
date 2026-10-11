# Plan técnico: Migración del frontend web a AWS

- **Spec**: ./spec.md
- **Estado**: aprobado <!-- borrador | aprobado -->
- **Fecha**: 2026-10-11

## 1. Resumen técnico

Next.js pasa a exportación estática (`output: "export"`, `trailingSlash: true`) y el resultado (`out/`) se sube a un bucket S3 privado servido por CloudFront con Origin Access Control. El navegador llama directamente al API Gateway compartido: su URL se lee del parámetro SSM `/urban-alert/plataforma/api-endpoint` en cada Provision y se incrusta en el build como `NEXT_PUBLIC_API_URL`; un helper `urlApi()` antepone esa base a las rutas `/api/v1/...` que ya usa el código. El detalle del histórico pasa de `/historial/[id]` a `/historial/detalle/?id=<id>`. Un solo stack de Terraform (`infra/web`) y dos workflows (Provision en cada push a `main`, Deprovision manual), con el patrón de `urban-alert-usuarios`.

## 2. Contexto técnico

| Aspecto | Valor |
|---|---|
| Lenguaje / versión | TypeScript 5, Next.js 16.3.8 (App Router), React 19.2; Node 24 en CI |
| Dependencias principales | Leaflet / react-leaflet, Tailwind 4 (sin cambios) |
| Almacenamiento | Ninguno propio; S3 solo para los archivos del sitio |
| Pruebas | Vitest + Testing Library (`npm test`), `node --test` para la CloudFront Function, `terraform test` con `mock_provider` |
| Plataforma objetivo | S3 + CloudFront (us-east-2 / global), cuenta 348364742283 |
| Restricciones | Sin servidor; rewrites/redirects/headers de Next no existen en export (docs `static-exports.md`); el rol de GitHub no tiene permisos de CloudFront hoy |

## 3. Verificación contra la constitución

| Principio | ¿Cumple? | Nota / justificación de excepción |
|---|---|---|
| P1 | Sí | Infra y publicación (`s3 sync`, invalidación) solo desde los workflows en `main` |
| P2 | Sí | Política nueva del rol en `infra/bootstrap/` (la aplica un administrador); la plataforma solo se lee por SSM |
| P3 | Sí | OIDC; `NEXT_PUBLIC_API_URL` es una URL pública, no un secreto |
| P4 | Sí | Solo Deprovision con confirmación `urban-alert-web`; `force_destroy` en el bucket porque su contenido se reconstruye del commit |
| P5 | Sí | S3 + CloudFront sin coste por hora; ≈ 0 USD/mes dentro de la capa gratuita (D-008) |
| P6 | Sí | Job `test`: lint, vitest, build, `node --test`, fmt/validate/test, actionlint, shellcheck |
| P7 | Sí | Tests de bucket privado, política solo para la distribución, HTTPS, OAC, función y 404 |
| P8 | Sí | Terraform 1.16.5, aws ~> 6.0, lock con 3 plataformas, Node 24, actions e imágenes fijadas |
| P9 | Sí | URL del gateway solo desde SSM; prefijo `urban-alert-web`; etiquetas `Service=web` |
| P10 | Sí | `concurrency: urban-alert-web-aws` compartido, sin cancelación |

## 4. Arquitectura y componentes

```text
 Navegador ──HTTPS──► CloudFront (dxxxx.cloudfront.net)
   │                    · función viewer-request: /ruta/ → /ruta/index.html
   │                    · cabeceras de seguridad (política gestionada)
   │                    · 403/404 de S3 → /404.html con estado 404
   │                    └─ OAC (SigV4) ──► S3 urban-alert-web-348364742283 (privado)
   │
   └──HTTPS (CORS)──► API Gateway compartido  (NEXT_PUBLIC_API_URL, leída de SSM en el build)
                        /api/v1/reportes · /usuarios · /geoespacial · /auditoria
```

- **Aplicación**: sin cambios funcionales salvo `urlApi()` y el detalle por query string.
- **`next.config.ts`**: función por fase. En `next dev` mantiene los rewrites a los servicios locales (RF-013); en `next build` exporta sin rewrites.
- **Provision**: test → `check-platform.sh` → `terraform apply infra/web` → leer `api-endpoint` de SSM → `npm run build` con `NEXT_PUBLIC_API_URL` → `publicar-sitio.sh` (sync + invalidación) → `smoke-web.sh`.

## 5. Estructura de archivos

```text
app/lib/api.ts                         # + urlApi(); obtenerJson la usa
app/lib/api.test.ts                    # + pruebas de urlApi
app/lib/usuarios.ts                    # fetch(urlApi(...))
app/reportes/nuevo/page.tsx            # fetch(urlApi(...)) ×3
app/historial/[id]/                    # → se elimina
app/historial/detalle/page.tsx         # detalle con ?id= (useSearchParams + Suspense)
app/historial/detalle/page.test.tsx    # pruebas movidas y adaptadas
app/historial/components/TablaReportes.tsx  # enlace /historial/detalle/?id=
next.config.ts                         # export por fase, trailingSlash
.env.example                           # NEXT_PUBLIC_API_URL documentada
Dockerfile                             # se elimina (D-009)
infra/bootstrap/README.md, github-web-policy.json
infra/web/{versions,providers,backend,variables,main,cloudfront,outputs}.tf, terraform.tfvars, .terraform.lock.hcl
infra/web/funciones/indice.js, indice.test.mjs
infra/web/tests/web.tftest.hcl
scripts/check-platform.sh, publicar-sitio.sh, smoke-web.sh
.github/workflows/provision.yml, deprovision.yml
README.md, CLAUDE.md, .gitignore
```

## 6. Modelo de datos

No aplica.

## 7. Contratos / interfaces

- **Entrada (SSM, plataforma)**: `/urban-alert/plataforma/api-endpoint` → `https://<api-id>.execute-api.us-east-2.amazonaws.com` (sin barra final).
- **Build**: `NEXT_PUBLIC_API_URL` (opcional). Vacía o ausente → rutas relativas (`/api/v1/...`, mismo origen, para `next dev`). `urlApi("/api/v1/x")` = base sin barras finales + ruta.
- **Rutas consumidas** (todas públicas en el gateway hoy): `ANY /api/v1/reportes[/…]`; `GET /api/v1/usuarios`; `GET /api/v1/geoespacial/reports`, `GET /api/v1/geoespacial/coordinates/{id}`; `GET /api/v1/auditoria/reportes/{id}[/integridad]`. `POST /api/v1/usuarios` exige `AWS_IAM` → 403 desde el navegador (fuera de alcance, spec §8).
- **URL del detalle**: `/historial/detalle/?id=<id del reporte>`; sin `id` → «Reporte no encontrado».
- **Salidas de Terraform**: `bucket_name`, `distribution_id`, `site_url`.

## 8. Decisiones

### D-001: Exportación estática en S3 + CloudFront
- **Decisión**: `output: "export"` con `trailingSlash: true` (cada ruta → `ruta/index.html`).
- **Alternativas consideradas**: servidor Next en ECS Express/Amplify (coste por hora y operación para solo reenviar `/api/v1/*`, que ya hace el gateway).
- **Motivo**: toda la app es de cliente; P5. Aceptado por el usuario.

### D-002: URL del gateway incrustada en el build desde SSM
- **Decisión**: Provision lee `api-endpoint` de SSM y ejecuta `npm run build` con `NEXT_PUBLIC_API_URL`; el código usa `urlApi()`.
- **Alternativas consideradas**: (a) `config.json` leído en tiempo de ejecución: evita recompilar, pero obliga a esperar una petición extra antes de cada llamada y complica todas las pruebas; como cada Provision recompila igualmente, no aporta nada. (b) Comportamiento `/api/*` en CloudFront con el gateway como segundo origen (mismo origen, sin CORS): acopla la distribución al gateway y la plataforma ya decidió que el frontend llama por CORS.
- **Motivo**: es «dinámico» en lo que importa (nunca está escrita en el repo; si la plataforma se recrea, basta relanzar Provision), sencillo y probable con variables de entorno.

### D-003: Detalle con query string en vez de segmento dinámico
- **Decisión**: `/historial/detalle/?id=<id>` con `useSearchParams` dentro de `<Suspense>` (exigido para prerenderizar).
- **Alternativas consideradas**: `generateStaticParams` con un id comodín + reescritura en la CloudFront Function de `/historial/*` hacia esa página (la página tendría que leer el id de `window.location`, frágil y acoplado a la CDN).
- **Motivo**: la exportación no admite rutas dinámicas sin `generateStaticParams` y los ids solo existen en tiempo de ejecución; la query string funciona igual en `next dev`, en S3 y en las pruebas.

### D-004: `next.config.ts` por fase
- **Decisión**: exportar una función `(phase) => …`; con `PHASE_DEVELOPMENT_SERVER` devuelve los rewrites actuales; en otro caso, `output: "export"` sin rewrites.
- **Motivo**: con `output: "export"` Next rechaza los rewrites incluso en `next dev` (docs `static-exports.md`); así se conserva el desarrollo local sin CORS (RF-013).

### D-005: Un solo stack `infra/web`
- **Decisión**: bucket, OAC, política del bucket, CloudFront Function y distribución en un stack; estado `web/terraform.tfstate`.
- **Motivo**: no hay dependencia de despliegue intermedia (a diferencia de los servicios con listener del ALB); el contenido lo sube el workflow, no Terraform.

### D-006: Detalles de la distribución
- **Decisión**: `PriceClass_100`, certificado por defecto `*.cloudfront.net`, `redirect-to-https`, HTTP/2+3, IPv6, política de caché gestionada `Managed-CachingOptimized` (respeta el `Cache-Control` del objeto), política de cabeceras `Managed-SecurityHeadersPolicy` (RNF-002), `default_root_object = index.html`, errores 403/404 → `/404.html` con 404 (con OAC y sin `s3:ListBucket`, S3 responde 403 a lo que no existe). Función `cloudfront-js-2.0` en viewer-request: si la URI termina en `/` añade `index.html`; si el último segmento no tiene extensión añade `/index.html`.
- **Motivo**: lo más barato y estándar; las políticas gestionadas evitan recursos propios.

### D-007: Publicación con dos `s3 sync`
- **Decisión**: `scripts/publicar-sitio.sh`: (1) `out/_next/static/` con `Cache-Control: public, max-age=31536000, immutable`, sin `--delete`; (2) el resto con `public, max-age=0, must-revalidate` y `--delete` excluyendo `_next/static/*`; (3) invalidación `/*` y espera a que termine.
- **Motivo**: RNF-001 y caso borde de pestañas abiertas (los recursos versionados antiguos se conservan). Acumulan unos MB por publicación: coste despreciable.

### D-008: Coste
- **Decisión**: S3 (< 50 MB, ≈ 0,00 USD), CloudFront (capa gratuita permanente: 1 TB y 10 M peticiones/mes; funciones: 2 M invocaciones; invalidaciones: 1.000 rutas/mes), sin recursos por hora. ≈ 0 USD/mes (RNF-003).

### D-009: Se elimina el `Dockerfile`
- **Decisión**: borrar `Dockerfile` (dependía de `output: "standalone"`, que desaparece).
- **Alternativas consideradas**: imagen Nginx con `out/` (nadie la usa: el compose del monorepo construye su propia copia).
- **Motivo**: no dejar un artefacto roto.

### D-010: Política de arranque propia
- **Decisión**: `infra/bootstrap/github-web-policy.json` (`github-actions-urban-alert-web`) con las acciones de CloudFront necesarias (distribución, OAC, funciones, invalidaciones, etiquetas, lectura de políticas gestionadas) sobre `arn:aws:cloudfront::348364742283:*` y `ListCachePolicies`/`ListResponseHeadersPolicies` sobre `*`. S3 (`urban-alert-*`) y SSM (`/urban-alert/*`) ya los cubren las políticas existentes.
- **Motivo**: P2; la aplica un administrador una vez.

### D-011: CORS sin cambios en la plataforma
- **Decisión**: no tocar `cors_origenes` (`*`). Recomendación documentada: restringirlo a `site_url` desde el repo de la plataforma cuando el sitio exista.

## 9. Estrategia de pruebas

- **Unitarias (Vitest)**: `urlApi` sin base, con base, con barra final (`vi.stubEnv`); llamadas existentes siguen usando rutas relativas en pruebas; detalle con `?id=`, sin `id`, 404.
- **Build**: `npm run build` genera `out/index.html`, `out/mapa/index.html`, `out/historial/index.html`, `out/historial/detalle/index.html`, `out/reportes/nuevo/index.html`, `out/404.html`; con `NEXT_PUBLIC_API_URL=https://ejemplo.invalid` la cadena aparece en `out/_next/static/**.js`.
- **Función CloudFront**: `node --test infra/web/funciones/` (URIs `/`, `/mapa/`, `/mapa`, `/_next/x.js`, `/historial/detalle/?id` → la query va aparte).
- **Terraform**: `terraform test` con `mock_provider` (bloqueo público, propiedad, política solo `cloudfront.amazonaws.com` con `AWS:SourceArn`, `redirect-to-https`, OAC `sigv4/always`, función asociada, error 404, etiquetas).
- **Smoke (Provision)**: `smoke-web.sh <site_url> <api_url>`.

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El rol no tiene permisos de CloudFront | Primer Provision falla | Política D-010 en `infra/bootstrap/` antes del primer push; el error indica la acción |
| CloudFront tarda ~5–15 min en crear/eliminar | Flujos lentos | Aceptado; `wait_for_deployment` por defecto |
| `useSearchParams` sin `Suspense` rompe el build | Build en rojo | `Suspense` en la página; verificado con `npm run build` |
| La plataforma se recrea y cambia la URL | Sitio apunta a un gateway inexistente | Relanzar Provision (lee SSM de nuevo); documentado |
| Mapeo 403→404 oculta un fallo de permisos del bucket | Diagnóstico confuso | La prueba de humo exige 200 en `/` y páginas conocidas |

## 11. Trazabilidad

| Requisito | Componentes | Pruebas |
|---|---|---|
| RF-001 | next.config.ts, infra/web | build, smoke |
| RF-002 | app/lib/api.ts, usuarios.ts, nuevo/page.tsx | api.test.ts, smoke |
| RF-003 | provision.yml | smoke (URL del gateway en el JS) |
| RF-004 | app/historial/detalle | detalle/page.test.tsx, smoke |
| RF-005 | funciones/indice.js, cloudfront.tf | indice.test.mjs, web.tftest.hcl, smoke |
| RF-006, RF-007 | cloudfront.tf, main.tf | web.tftest.hcl |
| RF-008, RF-009 | provision.yml, scripts | actionlint, shellcheck, primer Provision |
| RF-010, RF-011, RF-012 | workflows | actionlint, Deprovision |
| RF-013 | next.config.ts | comprobación de la config por fase |
| RF-014 | README.md | revisión |
| RNF-001 | publicar-sitio.sh | smoke (cabeceras) |
| RNF-002 | cloudfront.tf | web.tftest.hcl |
| RNF-003 | D-008 | tabla de costes |
| RNF-004 | app/** | `npm test` |
