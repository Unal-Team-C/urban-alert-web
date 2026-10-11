# UrbanAlert — Frontend web

Portal web de UrbanAlert: creación de reportes, mapa de daños e histórico para el administrador. Next.js 16 (App Router), React 19, Tailwind 4 y Leaflet. Toda la aplicación se ejecuta en el navegador y llama a los microservicios a través del API Gateway compartido.

En AWS se publica como **sitio estático** en S3 detrás de CloudFront (cuenta `348364742283`). Spec, plan y decisiones en [specs/001-migracion-aws](specs/001-migracion-aws/).

## Arquitectura en AWS

```text
 Navegador ──HTTPS──► CloudFront (https://<id>.cloudfront.net)
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
| CloudFront, OAC, función de índices | [`infra/web/cloudfront.tf`](infra/web/cloudfront.tf), [`infra/web/funciones/indice.js`](infra/web/funciones/indice.js) |
| Pruebas de Terraform (`mock_provider`) | [`infra/web/tests/web.tftest.hcl`](infra/web/tests/web.tftest.hcl) |
| URL del gateway en las llamadas | `urlApi()` en [`app/lib/api.ts`](app/lib/api.ts) |
| Configuración por fase (export / rewrites en dev) | [`next.config.ts`](next.config.ts) |

La URL pública del sitio aparece en el resumen de cada ejecución de Provision (salida `site_url` de Terraform).

## Workflows

| Workflow | Cuándo | Qué hace |
|---|---|---|
| [Provision](.github/workflows/provision.yml) | Cada push a `main` | Lint, pruebas, build, pruebas de la función, `fmt`/`validate`/`test` de Terraform, actionlint, shellcheck → [comprueba la plataforma](scripts/check-platform.sh) y lee la URL del gateway → `apply` → build con `NEXT_PUBLIC_API_URL` → [publica](scripts/publicar-sitio.sh) (sync + invalidación) → [prueba de humo](scripts/smoke-web.sh) → resumen |
| [Deprovision](.github/workflows/deprovision.yml) | Solo a mano | Exige escribir `urban-alert-web` → `destroy` (distribución, función, OAC, bucket y su contenido) |

Comparten el grupo de `concurrency` `urban-alert-web-aws`: nunca se ejecutan a la vez. Desaprovisionar el frontend no afecta a la plataforma ni a los microservicios.

**Caché**: los archivos de `_next/static/` (con hash en el nombre) se sirven con `max-age=31536000, immutable` y no se borran al publicar, para no romper pestañas abiertas; el HTML y el resto se revalidan en cada visita (`max-age=0`). Cada publicación invalida `/*`.

## Costes

Estimación mensual con tráfico de un proyecto académico:

| Recurso | Precio | Mes |
|---|---|---|
| S3 (≈ 2 MB por publicación) | 0,023 USD/GB-mes + peticiones | ~0 |
| CloudFront | Capa gratuita permanente: 1 TB de salida y 10 M peticiones al mes | 0 |
| CloudFront Functions | Capa gratuita: 2 M invocaciones al mes | 0 |
| Invalidaciones | 1.000 rutas al mes gratis (cada publicación usa 1: `/*`) | 0 |
| **Total** | | **~0 USD** |

No hay recursos con coste por hora. Los recursos de `_next/static/` de publicaciones anteriores se acumulan en el bucket (unos MB por publicación); un Deprovision los elimina.

## Arranque (una sola vez)

El rol de GitHub necesita una política nueva para CloudFront, que aplica un administrador, y el repo necesita el secreto `AWS_ROLE_ARN` y la variable `AWS_REGION`. Pasos en **[infra/bootstrap/README.md](infra/bootstrap/README.md)**. Estado de Terraform: `s3://urban-alert-tfstate-348364742283/web/terraform.tfstate`.

## Desarrollo local

```bash
npm ci
npm run dev        # http://localhost:3000
```

Sin `NEXT_PUBLIC_API_URL`, `npm run dev` reenvía `/api/v1/reportes`, `/api/v1/usuarios` y la consulta del mapa a los servicios locales (`REPORTES_API_URL`, `USUARIOS_API_URL`, `GEOESPACIAL_API_URL`; por defecto `localhost:5039`, `:8081` y `:8000`). Para usar el gateway de AWS desde local, copia [`.env.example`](.env.example) a `.env.local` y pon su URL (el gateway admite CORS desde cualquier origen).

## Validación local

```bash
npm run lint && npm test && npm run build
node --test infra/web/funciones/indice.test.mjs
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
- **CORS**: el gateway admite cualquier origen (`cors_origenes = ["*"]` en `urban-alert-plataforma`). Se recomienda restringirlo a la URL del sitio desde ese repo.
- Sin dominio propio: se usa la URL `*.cloudfront.net`.

## Desarrollo con SDD

Se desarrolla con **desarrollo guiado por especificaciones (SDD)** usando Claude Code y un arnés con persistencia en disco. Las features van en `specs/NNN-nombre/`.

- Guía de uso: [.sdd/GUIA.md](.sdd/GUIA.md) · Referencia: [.sdd/README.md](.sdd/README.md) · Protocolo: [.sdd/PROTOCOL.md](.sdd/PROTOCOL.md)
