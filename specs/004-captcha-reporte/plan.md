# Plan técnico: Verificación humana (captcha) en el formulario de nuevo reporte

- **Spec**: ./spec.md
- **Estado**: aprobado <!-- borrador | aprobado -->
- **Fecha**: 2026-10-19

## 1. Resumen técnico

Un componente cliente propio, `VerificacionHumana`, que no añade dependencias de npm. Carga una sola vez el script `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit` y renderiza el widget con `turnstile.render(contenedor, { sitekey, action: "crear-reporte", theme: "auto", callback, "expired-callback", "error-callback" })`. Expone `reiniciar()` mediante una ref.

El formulario guarda el token en su estado, deshabilita el botón mientras no haya token, añade `captchaToken` al `FormData` y reinicia el widget tras cualquier respuesta que no sea 2xx o tras un error de red.

La clave pública llega en el build como `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, que en Provision se toma de la variable de repositorio `TURNSTILE_SITE_KEY`. Sin clave, el componente no se monta y el formulario queda como hoy.

## 2. Contexto técnico

| Aspecto | Valor |
|---|---|
| Stack | Next.js 16.3.8 con `output: "export"` (sitio estático en S3 y CloudFront), React 19.2.8, Tailwind 4 |
| Pruebas | Vitest 4 + Testing Library (jsdom); `npm run lint`, `npm test`, `npm run build` |
| Proveedor | Cloudflare Turnstile, renderizado explícito. Clave de prueba `1x00000000000000000000AA` (siempre pasa), `2x00000000000000000000AB` (siempre falla) |
| Infraestructura | Ninguna. La política de cabeceras administrada de CloudFront no define CSP |

## 3. Verificación contra la constitución

| Principio | ¿Cumple? | Nota |
|---|---|---|
| P1 | Sí | Sin cambios de Terraform. El workflow solo añade una variable al build. |
| P2 | Sí | Las claves de Turnstile las gestiona el equipo en Cloudflare, fuera de todo repo. |
| P3 | Sí | La clave pública (*site key*) no es secreta, porque viaja al navegador por diseño. Va en una variable de repositorio, no en un secreto. El secreto del servidor solo lo tiene Reportes. |
| P5 | Sí | Sin coste. |
| P6 | Sí | lint, test, build y actionlint antes de cada commit. |
| P7 | N/A | Sin infraestructura nueva. |
| P8 | Sí | Sin dependencias nuevas. El script del proveedor se carga desde su URL oficial (Cloudflare no publica versiones fijadas de `api.js`); es una excepción inevitable y queda documentada. |
| P9 | Sí | Contrato con Reportes: el campo `captchaToken` (spec 003). |

## 4. Arquitectura y componentes

```text
app/lib/turnstile.ts           cargarTurnstile(): Promise<Turnstile>  (un solo <script>, memoizado)
                               claveSitioTurnstile(): string           (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY literal)
app/components/VerificacionHumana.tsx
    props: claveSitio, onToken(token|null)
    ref:   reiniciar()
    estados: cargando → listo | error ("No se pudo cargar la verificación…")
app/reportes/nuevo/page.tsx
    const claveSitio = claveSitioTurnstile()
    [captchaToken, setCaptchaToken]
    botón disabled = submitting || (claveSitio && !captchaToken)
    texto aria-live "Complete la verificación para enviar" cuando falta
    FormData.append("captchaToken", token)  si hay clave
    tras !ok o catch: verificacionRef.current?.reiniciar(); setCaptchaToken(null)
```

## 5. Estructura de archivos

```text
app/lib/turnstile.ts                       (nuevo)
app/lib/turnstile.test.ts                  (nuevo)
app/components/VerificacionHumana.tsx      (nuevo)
app/components/VerificacionHumana.test.tsx (nuevo)
app/reportes/nuevo/page.tsx                (mod)
app/reportes/nuevo/page.test.tsx           (mod)
.github/workflows/provision.yml            (mod) NEXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ vars.TURNSTILE_SITE_KEY }}
README.md, CLAUDE.md                       (mod)
```

## 6. Modelo de datos

Sin cambios.

## 7. Contratos / interfaces

- **Petición a Reportes**: el `multipart/form-data` actual más el campo `captchaToken`, solo si hay clave de sitio.
- **Errores**: el 400 de verificación de Reportes trae `{"message": …}`, que el formulario ya muestra con `leerError`. Con cualquier error, el widget se reinicia.
- **Build**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. En local va en `.env.local` (ignorado), con la clave de prueba para desarrollo.

## 8. Decisiones

### D-001: Componente propio en lugar de una librería React de Turnstile
- **Alternativas**: `@marsidev/react-turnstile` u otras librerías: una dependencia más que fijar y revisar para unas 60 líneas.
- **Motivo**: la API explícita de Turnstile es pequeña y el componente propio es fácil de probar con un `window.turnstile` falso.

### D-002: Clave pública en una variable de repositorio de GitHub
- **Motivo**: se puede activar o cambiar sin commit. Si la variable no existe, el build sale sin captcha y el formulario queda como hoy (RF-007).

### D-003: Reiniciar tras cualquier error
- **Motivo**: el token es de un solo uso y Reportes lo consume al verificarlo, aunque la creación falle después.

## 9. Estrategia de pruebas

- **`turnstile.test.ts`**:
  - `cargarTurnstile` añade un solo `<script>` aunque se llame dos veces;
  - resuelve con `window.turnstile` al cargar y rechaza con `onerror`;
  - `claveSitioTurnstile` lee la variable del build.
- **`VerificacionHumana.test.tsx`**, con un `window.turnstile` falso:
  - renderiza con la `sitekey`, `action` "crear-reporte" y `theme` "auto";
  - `callback` → `onToken(token)`;
  - `expired-callback` y `error-callback` → `onToken(null)`;
  - `reiniciar()` llama a `turnstile.reset(id)` y a `onToken(null)`;
  - si el script falla, muestra el error.
- **`page.test.tsx`**:
  - sin clave: no hay widget y el botón está habilitado (comportamiento actual);
  - con clave (`vi.stubEnv`): botón deshabilitado y texto de verificación pendiente; con token, el `FormData` enviado incluye `captchaToken`; tras un 400, el widget se reinicia, el botón vuelve a deshabilitarse y los datos se conservan.
- **Navegador**: `npx next dev -p 3930` con la clave de prueba `1x00000000000000000000AA` y el panel del navegador para ver el widget en tema claro, oscuro y móvil. Contra Reportes local, con la 003 activada y el secreto de prueba, se crea un reporte de punta a punta.
- **Comandos**: `npm run lint && npm test && npm run build`; actionlint por Podman.

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Activar Reportes (003) antes de publicar este cambio | Las creaciones fallan con 400 | Orden documentado en ambos repos: primero el portal con la clave y después el servicio. |
| El script de Cloudflare está bloqueado (bloqueadores de anuncios o redes corporativas) | No se puede enviar | Mensaje claro en lugar del widget (RF-006). Se acepta: sin verificación no hay envío. |
| El dominio de CloudFront no está dado de alta en el widget de Cloudflare | El widget falla con error | Paso de activación documentado: añadir el dominio `*.cloudfront.net` del sitio y `localhost`. |

## 11. Trazabilidad

| Requisito | Componentes | Pruebas |
|---|---|---|
| RF-001 | VerificacionHumana | UT: parámetros de render |
| RF-002 | page.tsx | UT: botón y texto |
| RF-003 | page.tsx | UT: el FormData lleva captchaToken |
| RF-004 | page.tsx + reiniciar() | UT: reinicio tras 400, datos conservados |
| RF-005 | expired/error callbacks | UT |
| RF-006 | VerificacionHumana | UT: error de carga |
| RF-007 | claveSitioTurnstile + page.tsx | UT: sin clave no hay widget |
| RNF-001 | Carga del script solo en el componente | UT: un solo script; revisión |
| RNF-002 | Workflow | actionlint, revisión |
| RNF-003 | aria-live, widget del proveedor | UT: rol status; navegador |
