@AGENTS.md

# CLAUDE.md

Frontend web de UrbanAlert (Next.js 16 App Router, React 19, Tailwind 4, Leaflet), extraído del monorepo UrbanAlert para
migrarlo a AWS. Todo se ejecuta en el navegador: se publica como sitio estático (spec `specs/001-migracion-aws/`).

- Local: `npm run dev` (reenvía `/api/v1/*` a los servicios locales), `npm test`, `npm run lint`, `npm run build` (genera `out/`).
- Toda llamada a la API pasa por `urlApi()` (`app/lib/api.ts`), que antepone `NEXT_PUBLIC_API_URL` (URL del API Gateway; vacía en local).
- Nada de rutas de servidor, proxy, server actions, rewrites/headers en producción ni rutas dinámicas sin `generateStaticParams`: rompen `output: "export"`. Ids de tiempo de ejecución van en la query (`/historial/detalle/?id=`), con `useSearchParams` dentro de `<Suspense>`.

AWS (cuenta 348364742283): `infra/web` (S3 privado + CloudFront con OAC y función de índices; mientras la cuenta no esté
verificada para CloudFront, `cdn_habilitado = false` y lo sirve la Lambda `infra/web/origen` con function URL, plan D-012), estado en
`s3://urban-alert-tfstate-348364742283/web/terraform.tfstate`. Terraform y la publicación solo desde GitHub Actions:
`provision.yml` (push a `main`; lee la URL del gateway de SSM `/urban-alert/plataforma/api-endpoint`) y
`deprovision.yml` (manual, confirmación `urban-alert-web`). Arranque: `infra/bootstrap/README.md` (política de CloudFront).

## Validación local (Podman para lo que no está instalado)

- `npm run lint && npm test && npm run build` y `node --test infra/web/funciones/indice.test.mjs infra/web/origen/index.test.mjs`.
- Terraform, actionlint y shellcheck: comandos en el README («Validación local»).

## Gotchas

- `next dev` reescribe `next-env.d.ts`: revertirlo antes de commitear.
- `tsc --noEmit` sin un `next build` previo falla por `PageProps`/`LayoutProps` (tipos generados en `.next/types`).
- `next/link` añade la barra final (`trailingSlash`) solo en el build: en las pruebas los `href` salen sin ella.
- En `terraform test`, comparar `list == tuple` siempre da false: usar `toset(...)` a ambos lados.
- `node --test <carpeta>` funciona en Node 26 pero en Node 24 (CI) trata la carpeta como un módulo: pasar el archivo `.test.mjs`.
- Una function URL pública necesita dos permisos: `lambda:InvokeFunctionUrl` y `lambda:InvokeFunction` con `invoked_via_function_url = true`.
- El rol de GitHub solo puede adjuntar políticas gestionadas de ECS: los roles de este repo usan políticas en línea.
- macOS trae bash 3.2: los scripts no usan funciones de bash 4.

## Desarrollo guiado por especificaciones (SDD)

Este proyecto usa un arnés SDD con persistencia en disco para sobrevivir a interrupciones de sesión.
El protocolo es obligatorio en todas las sesiones:

@.sdd/PROTOCOL.md
