# Tareas: Identidad del sitio (título, idioma e icono)

- **Plan**: ./plan.md
- **Estado**: aprobado <!-- borrador | aprobado -->

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecha · `[!]` bloqueada · `[-]` descartada · `[P]` paralelizable

## Fase 1: Núcleo

- [x] T001 Metadatos raíz (título por defecto y plantilla, descripción), `lang="es"` y títulos por sección; pruebas — archivos: app/layout.tsx, app/layout.test.tsx, app/reportes/nuevo/layout.tsx, app/historial/layout.tsx, app/historial/detalle/layout.tsx, app/mapa/layout.tsx — cubre: RF-001, RF-002, RF-003 — verifica: `npm test`, `npm run build` y `out/*/index.html` con los títulos de HU-1.2
- [x] T002 Página `not-found` en español con título — archivos: app/not-found.tsx, app/not-found.test.tsx — cubre: RF-001 — verifica: `npm test`; `out/404.html` con «Página no encontrada · UrbanAlert»
- [x] T003 [P] Iconos del pin (512, 180, 32 px) y borrar los SVG de la plantilla — archivos: app/icon.png, app/apple-icon.png, app/favicon.ico, public/*.svg — cubre: RF-004, RF-005 — verifica: build con `<link rel="icon">` y `apple-touch-icon`; revisión visual a 32 px; `grep -r "Create Next App" out` vacío

## Fase 2: Integración

- [x] T004 Comprobar título y ausencia de la plantilla en `smoke-web.sh` — archivos: scripts/smoke-web.sh — cubre: MS-001 — verifica: shellcheck; smoke local contra `out/`
- [ ] T005 Publicar (push con permiso) y verificar MS-001/MS-002 en el sitio — cubre: MS-001, MS-002 — verifica: Provision en verde; pestaña con título e icono en `/`, `/reportes/nuevo/`, `/historial/`

## Cobertura

| Requisito | Tareas |
|---|---|
| RF-001 | T001, T002 |
| RF-002 | T001 |
| RF-003 | T001 |
| RF-004 | T003 |
| RF-005 | T003, T004 |
