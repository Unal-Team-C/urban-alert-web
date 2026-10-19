# Verificación: Verificación humana (captcha) en el formulario de nuevo reporte

- **Fecha**: 2026-10-19
- **Rama**: `004-captcha-reporte`, desde el `main` local (incluye 2f35e79, sin push). Commits locales sin push.
- **Resultado global**: ✅ en local y en el navegador. ⚠️ La publicación y la activación con la *site key* real quedan pendientes del equipo.

## Comandos

| Comando | Resultado |
|---|---|
| `npm run lint` | ✅ limpio |
| `npm test` | ✅ 149/149 (16 nuevas: turnstile 5, VerificacionHumana 6, formulario 4, más 1 de tamaño) |
| `npm run build` sin clave y con la clave de prueba | ✅ los dos; la clave solo aparece en el bundle si se define |
| actionlint | ✅ |
| `git diff main -- infra` | ✅ sin cambios |
| Navegador (panel): `next dev` con la clave de prueba y Reportes local con la 003 activa | ✅ widget visible, botón habilitado tras la prueba, envío → `POST /api/v1/reportes` **201** y modal "Reporte creado"; Reportes verificó con el `siteverify` real |

## Matriz de requisitos

| Requisito | Evidencia | Estado |
|---|---|---|
| RF-001 widget con acción crear-reporte | UT `VerificacionHumana` (parámetros de render); navegador | ✅ |
| RF-002 botón deshabilitado y texto | UT del formulario (`con clave, el envío espera…`) | ✅ |
| RF-003 `captchaToken` en el cuerpo | UT del formulario (FormData); E2E 201 | ✅ |
| RF-004 reinicio tras error, con los datos conservados | UT (400 → `reset`, botón deshabilitado, descripción conservada); también tras un éxito | ✅ |
| RF-005 vencimiento o error → sin prueba | UT (`expired-callback`, `error-callback`) | ✅ |
| RF-006 error de carga del script | UT (`si el script no carga muestra un error`) | ✅ |
| RF-007 sin clave = como antes | UT del formulario (sin widget, sin campo); build sin clave | ✅ |
| RNF-001 script solo en `/reportes/nuevo` | `cargarTurnstile` se llama solo desde el componente; UT de un solo script | ✅ |
| RNF-002 sin coste ni infraestructura | `vars.TURNSTILE_SITE_KEY` en el workflow; diff sin `infra/` | ✅ |
| RNF-003 accesible | `role="status"` con `aria-live`; widget accesible del proveedor | ✅ |
| Casos borde: tema oscuro, móvil | Navegador: corregido en D-004 (tema claro; compacto con menos de 300 px, 263 px sin recorte) | ✅ |

## Hallazgos

- **Corregido en T005 (D-004)**: con `theme: "auto"` el widget salía oscuro sobre el formulario claro, y en 375 px quedaba recortado.
- **Mejora asociada**: `leerError` muestra el mensaje del servicio también en los 503. Antes todo 503 decía "registrar la ubicación", lo que era engañoso para los fallos de Multimedia y del captcha.
- **Pendiente del equipo**: crear el widget en Cloudflare, definir `TURNSTILE_SITE_KEY` y publicar antes de activar Reportes.
