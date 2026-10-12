# Plan técnico: Identidad del sitio (título, idioma e icono)

- **Spec**: ./spec.md
- **Estado**: borrador <!-- borrador | aprobado -->
- **Fecha**: 2026-10-12

## 1. Resumen técnico

Metadatos de Next.js en el layout raíz (`title.default` «UrbanAlert», `title.template` «%s · UrbanAlert», descripción) y un `layout.tsx` de servidor por sección que fija el título de su página (las páginas son componentes de cliente y no pueden exportar `metadata`). `lang="es"`. Icono: el pin recortado del logo con `sips`, como `app/icon.png`, `app/apple-icon.png` y `app/favicon.ico` (convenciones de archivo de Next, resueltas en el build). Página `not-found` propia en español. Se borran los SVG de la plantilla.

## 2. Contexto técnico

| Aspecto | Valor |
|---|---|
| Lenguaje / versión | TypeScript, Next.js 16 App Router (exportación estática) |
| Dependencias | Ninguna nueva; `sips` de macOS para generar los iconos (una vez, se versionan los PNG/ICO) |
| Pruebas | Vitest (metadatos de los layouts, not-found), `npm run build` + comprobación de `out/` en `smoke-web.sh` |
| Restricciones | Constitución: todo en el navegador; metadatos estáticos (RNF-001) |

## 3. Verificación contra la constitución

| Principio | ¿Cumple? | Nota |
|---|---|---|
| P1–P5, P7–P10 | Sí | Sin cambios de infraestructura ni coste |
| P6 | Sí | lint, test y build antes de cada commit |

## 4. Arquitectura y componentes

- `app/layout.tsx`: `metadata = { title: { default: "UrbanAlert", template: "%s · UrbanAlert" }, description }`, `<html lang="es">`.
- Layouts de sección (servidor) con `metadata.title`: `reportes/nuevo` «Crear reporte», `historial` «Histórico de reportes», `historial/detalle` «Detalle del reporte», `mapa` «Mapa de daños». La raíz `/` hereda «UrbanAlert».
- `app/not-found.tsx`: «Página no encontrada» con enlace a inicio; genera `out/404.html`.
- Iconos: `app/icon.png` (512 × 512) y `app/apple-icon.png` (180 × 180) del pin, `app/favicon.ico` (32 × 32) reemplazando el de la plantilla.

## 5. Estructura de archivos

```text
app/layout.tsx                         # metadata raíz, lang es
app/layout.test.tsx                    # nuevo: metadatos raíz sin texto de plantilla
app/not-found.tsx, app/not-found.test.tsx
app/reportes/nuevo/layout.tsx          # nuevo
app/historial/layout.tsx               # + metadata
app/historial/detalle/layout.tsx       # nuevo
app/mapa/layout.tsx                    # + metadata
app/icon.png, app/apple-icon.png, app/favicon.ico
public/{file,globe,next,vercel,window}.svg   # se eliminan
scripts/smoke-web.sh                   # + título UrbanAlert y sin «Create Next App»
```

## 6. Modelo de datos

No aplica.

## 7. Contratos / interfaces

Títulos (HU-1.2): `/` «UrbanAlert»; `/reportes/nuevo/` «Crear reporte · UrbanAlert»; `/historial/` «Histórico de reportes · UrbanAlert»; `/historial/detalle/` «Detalle del reporte · UrbanAlert»; `/mapa/` «Mapa de daños · UrbanAlert»; 404 «Página no encontrada · UrbanAlert».

## 8. Decisiones

### D-001: Títulos por layout de sección
- **Decisión**: `layout.tsx` de servidor por sección con `metadata`.
- **Alternativas**: `document.title` en `useEffect` (no queda en el HTML exportado, parpadea); convertir páginas a servidor (rompe `useSearchParams`/estado).
- **Motivo**: estático en el HTML exportado y sin tocar las páginas.

### D-002: Iconos recortados del logo con `sips`
- **Decisión**: recortar el pin (sin el texto) del PNG de la spec 002, generar 512, 180 y 32 px y versionarlos. Si a 32 px se lee mal, se recorta más ajustado.
- **Motivo**: sin dependencias nuevas; las convenciones `icon`/`apple-icon`/`favicon.ico` de Next añaden los `<link>` en el build.

## 9. Estrategia de pruebas

- Vitest: `metadata` del layout raíz y de cada sección (títulos de HU-1.2, descripción, sin «Create Next App»); `not-found` muestra el texto y el enlace.
- Build: `out/index.html` contiene `<title>UrbanAlert</title>` y `lang="es"`; ningún archivo de `out/` contiene «Create Next App»; existen `out/icon.png`, `out/favicon.ico`.
- `smoke-web.sh`: `/` con título «UrbanAlert» y sin «Create Next App».

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Caché del icono en el navegador | Se ve el viejo un tiempo | Normal; Next añade un hash al `icon.png` |
| 002 cambia `/mapa` | Título sobrante | Se ajusta en 002 si `/mapa` deja de ser página propia |

## 11. Trazabilidad

| Requisito | Componentes | Pruebas |
|---|---|---|
| RF-001 | layouts | layout tests, build |
| RF-002 | app/layout.tsx | layout test |
| RF-003 | app/layout.tsx | build (`lang="es"`) |
| RF-004 | app/icon.png, apple-icon.png, favicon.ico | build |
| RF-005 | public/, smoke | build grep, smoke |
