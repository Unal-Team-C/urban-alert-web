# UrbanAlert — Frontend web

Portal web de UrbanAlert: creación de reportes, mapa de daños e histórico para el administrador. La página principal es el mapa a pantalla completa bajo una barra con el logo y «Crear reporte»; al pulsar un daño, su detalle se abre en un panel a la derecha (abajo en móvil). El formulario tiene «Volver al mapa» (última vista del mapa en el navegador). Specs: [002-rediseno-mapa](specs/002-rediseno-mapa/), [003-identidad-sitio](specs/003-identidad-sitio/). Next.js 16 (App Router), React 19, Tailwind 4 y Leaflet. Toda la aplicación se ejecuta en el navegador y llama a los microservicios a través del API Gateway compartido.

En AWS se publica como **sitio estático** en un bucket S3 privado (cuenta `348364742283`). Spec, plan y decisiones en [specs/001-migracion-aws](specs/001-migracion-aws/).

> **Origen**: CloudFront (`cdn_habilitado = true` en [`infra/web/terraform.tfvars`](infra/web/terraform.tfvars)). Mientras AWS no dejó crear distribuciones (cuenta sin verificar, octubre de 2026) el sitio lo sirvió una función Lambda con URL HTTPS sobre el mismo bucket (plan D-012); queda como alternativa con `cdn_habilitado = false`. Cambiar de origen cambia la URL del sitio.

### Origen alternativo (Lambda function URL, `cdn_habilitado = false`)

```text
 Navegador ──HTTPS──► Lambda function URL (https://<id>.lambda-url.us-east-2.on.aws)
   │                    urban-alert-web-origen: /mapa/ → mapa/index.html, 404.html con 404, solo GET/HEAD,
   │                    Cache-Control y ETag del objeto (304), cabeceras de seguridad
   │                    └─ rol propio (solo s3:GetObject) ──► S3 urban-alert-web-348364742283 (privado)
   │
   └──HTTPS (CORS)──► API Gateway compartido (urban-alert-plataforma)
```

Sin caché de borde ni WAF (AWS WAF no admite function URLs). Código y pruebas: [`infra/web/origen/`](infra/web/origen/), [`infra/web/lambda.tf`](infra/web/lambda.tf).

## Arquitectura en AWS (CloudFront, `cdn_habilitado = true`)

```text
 Navegador ──HTTPS──► CloudFront (https://<id>.cloudfront.net)   [AWS WAF opcional: waf_habilitado]
   │                    · función viewer-request: /mapa/ → /mapa/index.html
   │                    · cabeceras de seguridad (política gestionada)
   │                    · 403/404 de S3 → /404.html con estado 404
   │                    └─ Origin Access Control ──► S3 urban-alert-web-348364742283 (privado)
   │
   └──HTTPS (CORS)──► API Gateway compartido (urban-alert-plataforma)
                        /api/v1/reportes · /usuarios · /geoespacial · /auditoria
```

- `next build` genera `out/` con un `index.html` por ruta (`output: "export"`, `trailingSlash: true`).
- La URL del gateway **no está en el repositorio**: Provision la lee del parámetro SSM `/urban-alert/plataforma/api-endpoint` y la pasa al build como `NEXT_PUBLIC_API_URL`. Si la plataforma se recrea y cambia la URL, basta con relanzar Provision.
- El detalle de un reporte está en `/historial/detalle/?id=<id>` (una exportación estática no admite rutas dinámicas con ids que solo existen en tiempo de ejecución).

| Pieza | Dónde |
|---|---|
| Bucket privado, política solo para la distribución | [`infra/web/main.tf`](infra/web/main.tf) |
| Origen alternativo Lambda (plan D-012) | [`infra/web/lambda.tf`](infra/web/lambda.tf), [`infra/web/origen/index.mjs`](infra/web/origen/index.mjs) |
| AWS WAF básico, desactivado (plan D-013) | [`infra/web/waf.tf`](infra/web/waf.tf) |
| CloudFront, OAC, función de índices | [`infra/web/cloudfront.tf`](infra/web/cloudfront.tf), [`infra/web/funciones/indice.js`](infra/web/funciones/indice.js) |
| Pruebas de Terraform (`mock_provider`) | [`infra/web/tests/web.tftest.hcl`](infra/web/tests/web.tftest.hcl) |
| URL del gateway en las llamadas | `urlApi()` en [`app/lib/api.ts`](app/lib/api.ts) |
| Configuración por fase (export / rewrites en dev) | [`next.config.ts`](next.config.ts) |

La URL pública del sitio aparece en el resumen de cada ejecución de Provision (salida `site_url` de Terraform).

## Workflows

| Workflow | Cuándo | Qué hace |
|---|---|---|
| [Provision](.github/workflows/provision.yml) | Cada push a `main` | Lint, pruebas, build, pruebas de la función de CloudFront y del origen Lambda, `fmt`/`validate`/`test` de Terraform, actionlint, shellcheck → [comprueba la plataforma](scripts/check-platform.sh) y lee la URL del gateway → `apply` → build con `NEXT_PUBLIC_API_URL` → [publica](scripts/publicar-sitio.sh) (sync; invalidación solo con CloudFront) → [prueba de humo](scripts/smoke-web.sh) → resumen |
| [Deprovision](.github/workflows/deprovision.yml) | Solo a mano | Exige escribir `urban-alert-web` → `destroy` (distribución o Lambda, bucket y su contenido) |

Comparten el grupo de `concurrency` `urban-alert-web-aws`: nunca se ejecutan a la vez. Desaprovisionar el frontend no afecta a la plataforma ni a los microservicios.

**WAF** ([`infra/web/waf.tf`](infra/web/waf.tf)), **desactivado** para el prototipo de una semana (`waf_habilitado = false`, decisión del 2026-10-12). Con `true`, bloquea a una IP que supere 1.000 peticiones en 5 minutos (`waf_limite_peticiones`) y aplica los grupos gestionados de AWS sin suscripción (`AmazonIpReputationList`, `CommonRuleSet`, `KnownBadInputsRuleSet`). Con `waf_solo_monitor = true` las reglas solo cuentan. Métricas y muestras en la consola de WAF (región `us-east-1`).

**Caché**: los archivos de `_next/static/` (con hash en el nombre) se sirven con `max-age=31536000, immutable` y no se borran al publicar, para no romper pestañas abiertas; el HTML y el resto se revalidan en cada visita (`max-age=0`). Con CloudFront, cada publicación invalida `/*`.

## Costes

Estimación mensual con tráfico de un proyecto académico:

| Recurso | Precio | Mes |
|---|---|---|
| S3 (≈ 2 MB por publicación) | 0,023 USD/GB-mes + peticiones | ~0 |
| Lambda + function URL (solo con `cdn_habilitado = false`) | Capa gratuita: 1 M peticiones y 400.000 GB-s al mes; la URL no tiene coste propio | 0 |
| CloudWatch Logs del origen Lambda (30 días) | 0,50 USD/GB ingerido | ~0 |
| CloudFront | Capa gratuita permanente: 1 TB de salida y 10 M peticiones al mes | 0 |
| CloudFront Functions | Capa gratuita: 2 M invocaciones al mes | 0 |
| Invalidaciones | 1.000 rutas al mes gratis (cada publicación usa 1: `/*`) | 0 |
| AWS WAF (solo con `waf_habilitado = true`): web ACL + 4 reglas | 5 USD/mes + 1 USD/mes por regla + 0,60 USD por millón de peticiones | 0 (desactivado; ~9 USD si se activa) |
| **Total** | | **~0 USD** |

Sin el WAF no hay costes fijos ni recursos con coste por hora. Los recursos de `_next/static/` de publicaciones anteriores se acumulan en el bucket (unos MB por publicación); un Deprovision los elimina.

## Arranque (una sola vez)

El rol de GitHub necesita una política nueva para CloudFront, que aplica un administrador (el origen Lambda usa políticas que ya existen), y el repo necesita el secreto `AWS_ROLE_ARN` y la variable `AWS_REGION`. Pasos en **[infra/bootstrap/README.md](infra/bootstrap/README.md)**. Estado de Terraform: `s3://urban-alert-tfstate-348364742283/web/terraform.tfstate`.

## Verificación humana (captcha, spec 004)

El formulario de nuevo reporte muestra el widget de **Cloudflare Turnstile** si el build trae `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. El widget normalmente se resuelve solo. Sin prueba vigente no se puede enviar, la prueba viaja como campo `captchaToken`, y tras cada envío el widget se reinicia, porque la prueba es de un solo uso. La valida el servicio de Reportes (`urban-alert-reportes`, spec 003). Sin la clave, el formulario funciona como antes.

**Activación**, en este orden:

1. En Cloudflare, en **Turnstile → Add widget**: dominios `dfa8690dowmry.cloudfront.net` y `localhost`, modo *Managed*. Copia la *site key* (pública) y entrega la *secret key* a Reportes (su `infra/bootstrap/README.md §5`).
2. Aquí: `gh variable set TURNSTILE_SITE_KEY --repo Unal-Team-C/urban-alert-web --body <site key>` y un Provision (o el siguiente push a `main`). La *site key* no es secreta.
3. En Reportes: `captcha_habilitado = true` y el dominio de CloudFront en `captcha_hostnames`. Si se activa Reportes antes que el portal, todas las creaciones del portal responden 400.

En local se usa la clave de prueba de Cloudflare `1x00000000000000000000AA`, que siempre pasa (`2x00000000000000000000AB` siempre falla): `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run dev`. El script del widget se carga solo en `/reportes/nuevo`.

## Desarrollo local

```bash
npm ci
npm run dev        # http://localhost:3000
```

Sin `NEXT_PUBLIC_API_URL`, `npm run dev` reenvía `/api/v1/reportes`, `/api/v1/usuarios` y la consulta del mapa a los servicios locales (`REPORTES_API_URL`, `USUARIOS_API_URL`, `GEOESPACIAL_API_URL`; por defecto `localhost:5039`, `:8081` y `:8000`). Para usar el gateway de AWS desde local, copia [`.env.example`](.env.example) a `.env.local` y pon su URL (el gateway admite CORS desde cualquier origen).

## Validación local

```bash
npm run lint && npm test && npm run build
node --test infra/web/funciones/indice.test.mjs infra/web/origen/index.test.mjs
```

Terraform, actionlint y shellcheck con Podman (`podman machine start`), desde la raíz:

```bash
TF='podman run --rm -v "$PWD":/w -w /w docker.io/hashicorp/terraform:1.16.5'
eval "$TF -chdir=infra/web init -backend=false" && eval "$TF -chdir=infra/web validate" && eval "$TF -chdir=infra/web test"
eval "$TF fmt -check -recursive infra"
podman run --rm -v "$PWD":/repo -w /repo docker.io/rhysd/actionlint:1.7.7
podman run --rm -v "$PWD":/mnt -w /mnt docker.io/koalaman/shellcheck:v0.10.0 scripts/*.sh
```

`apply`, `plan` contra el estado real y `destroy` solo se ejecutan desde los workflows (constitución P1).

## Limitaciones conocidas

- **Crear usuarios** desde el portal responde 403 en AWS: el gateway exige firma de AWS en `POST /api/v1/usuarios` (decisión de la spec 001 de `urban-alert-usuarios`). El portal muestra el error.
- **Sin WAF** en el sitio (desactivado) ni en el API Gateway (AWS WAF no admite HTTP APIs). El gateway solo tiene su límite de tasa (50 peticiones/s); las rutas públicas de Reportes permiten escribir sin autenticación.
- **CORS**: el gateway admite cualquier origen (`cors_origenes = ["*"]` en `urban-alert-plataforma`). Se recomienda restringirlo a la URL del sitio desde ese repo.
- Sin dominio propio: se usa la URL `*.cloudfront.net`.
- La verificación humana (Turnstile) solo protege la **creación** de reportes. Si un bloqueador impide cargar el script de Cloudflare, el formulario lo indica y no permite enviar.
- Con el origen alternativo Lambda: sin caché de borde, sin WAF y un arranque en frío de unos cientos de ms en la primera petición.

## Desarrollo con SDD

Se desarrolla con **desarrollo guiado por especificaciones (SDD)** usando Claude Code y un arnés con persistencia en disco. Las features van en `specs/NNN-nombre/`.

- Guía de uso: [.sdd/GUIA.md](.sdd/GUIA.md) · Referencia: [.sdd/README.md](.sdd/README.md) · Protocolo: [.sdd/PROTOCOL.md](.sdd/PROTOCOL.md)
