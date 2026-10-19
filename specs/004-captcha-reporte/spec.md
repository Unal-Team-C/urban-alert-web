# Especificación: Verificación humana (captcha) en el formulario de nuevo reporte

- **ID**: 004-captcha-reporte
- **Estado**: implementada <!-- borrador | aclarada | aprobada | implementada -->
- **Creada**: 2026-10-19
- **Entrada original**: "Para el frontend quiero agregar una validación pequeña, un captcha para verificar que quien crea el reporte sea humano" + "Aplícalo", con el diseño acordado: Cloudflare Turnstile en el formulario; el token viaja en el cuerpo de la creación y lo valida el servicio de Reportes (feature `003-captcha-creacion` de `urban-alert-reportes`).

## 1. Resumen

El formulario de nuevo reporte muestra un desafío de verificación humana (normalmente invisible o de un clic) y envía su prueba junto con el reporte. Sin una prueba vigente no se puede enviar. Si la creación falla, el formulario pide una prueba nueva antes de reintentar. Si el sitio se publica sin la clave pública del proveedor, el formulario funciona como hoy.

## 2. Problema y contexto

El servicio de Reportes va a exigir la prueba en la creación (003). El portal es el cliente legítimo: tiene que obtenerla y enviarla sin estropear la experiencia de un ciudadano que reporta bajo estrés y con conectividad limitada (QAS-07).

## 3. Usuarios y actores

- **Ciudadano**: completar el reporte sin pasos difíciles; entender qué hacer si la verificación falla.

## 4. Historias de usuario

### HU-1: Enviar el reporte con la verificación (Prioridad: P1)

Como ciudadano quiero que el formulario verifique que soy humano sin estorbarme para poder enviar mi reporte.

**Criterios de aceptación**
1. Dado que el sitio tiene configurada la clave pública, cuando abro el formulario de nuevo reporte, entonces veo el widget de verificación cerca del botón de enviar.
2. Dado que la verificación no se ha completado, entonces el botón de enviar está deshabilitado y un texto indica que falta la verificación.
3. Dado que completé la verificación, cuando envío, entonces la prueba viaja con el reporte y, si el servicio lo crea, veo la confirmación como hoy.
4. Dado que la prueba vence antes de enviar (unos 5 minutos), entonces el widget la renueva o vuelve a pedirla y el botón se deshabilita hasta tener una nueva.

### HU-2: Reintentar tras un error (Prioridad: P1)

Como ciudadano quiero poder reintentar si algo falla, sin quedar bloqueado por una prueba ya usada.

**Criterios de aceptación**
1. Dado que el envío falla por cualquier motivo (400, 503, red), cuando veo el mensaje de error, entonces el widget se reinicia y obtengo una prueba nueva antes de reintentar; los datos del formulario se conservan.
2. Dado que el servicio rechaza la prueba (400 por verificación), entonces veo un mensaje que dice que la verificación falló y que la repita.

### HU-3: Sin clave configurada (Prioridad: P2)

Como equipo quiero publicar el sitio sin la clave pública y que nada cambie.

**Criterios de aceptación**
1. Dado que el build no tiene clave pública, cuando abro el formulario, entonces no se carga el script del proveedor ni aparece el widget, y el envío funciona como hoy.

### Casos borde

- El script del proveedor no carga (bloqueado o sin red): se muestra un error claro en lugar del widget y el botón sigue deshabilitado.
- El usuario tiene el tema oscuro: el widget sigue el tema del sitio.
- Pantallas angostas (móvil): el widget no desborda el formulario.

## 5. Requisitos funcionales

- **RF-001**: Con la clave pública configurada en el build, el formulario DEBE mostrar el widget del proveedor con la acción "crear-reporte".
- **RF-002**: El envío DEBE estar deshabilitado mientras no haya una prueba vigente, con un texto que lo explique.
- **RF-003**: El envío DEBE incluir la prueba como campo `captchaToken` del cuerpo.
- **RF-004**: Tras cualquier respuesta que no sea de éxito o un error de red, el formulario DEBE reiniciar el widget y descartar la prueba usada, conservando los datos introducidos.
- **RF-005**: Al vencer la prueba o fallar el desafío, el formulario DEBE descartar la prueba y deshabilitar el envío hasta obtener una nueva.
- **RF-006**: Si el script del proveedor no carga, el formulario DEBE mostrar un mensaje de error en el lugar del widget.
- **RF-007**: Sin clave pública en el build, el formulario NO DEBE cargar el script del proveedor y DEBE enviar como hoy (sin el campo).

## 6. Requisitos no funcionales

- **RNF-001**: El script del proveedor se carga solo en la página de nuevo reporte, no en el resto del sitio.
- **RNF-002**: Sin coste nuevo ni recursos de AWS nuevos; la clave pública no es secreta y puede ir en el build.
- **RNF-003**: Accesible: el widget del proveedor es accesible por teclado y lector de pantalla; el texto de estado se anuncia (región `aria-live`).

## 7. Entidades clave

No hay datos nuevos.

## 8. Fuera de alcance

- La validación del servidor (feature 003 de Reportes).
- Crear las claves en Cloudflare.
- Captcha en otras páginas (usuarios, histórico).

## 9. Supuestos

- Proveedor: Cloudflare Turnstile. En desarrollo y pruebas se usan sus claves de prueba oficiales.
- La clave pública llega en el build como variable pública, igual que la URL de la API.
- La política de cabeceras de seguridad de CloudFront (administrada por AWS) no define CSP, así que el script y el iframe del proveedor cargan sin cambios de infraestructura.

## 10. Métricas de éxito

- **MS-001**: Con clave configurada, un reporte enviado desde el portal llega con prueba y se crea; sin prueba vigente el botón no permite enviar.
- **MS-002**: Sin clave configurada, las pruebas actuales del formulario siguen pasando sin cambios de comportamiento.

## 11. Clarificaciones

<!-- /sdd-clarify añade aquí -->

---

### Checklist de calidad (autorrevisión antes de entregar)

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs, estructura de código)
- [x] Cada requisito es testeable y no ambiguo
- [x] Criterios de aceptación con resultado observable
- [x] Casos borde identificados
- [x] Alcance acotado (fuera de alcance explícito)
- [x] Como máximo 3 `[NEEDS CLARIFICATION]` pendientes
- [x] Coherente con `.sdd/constitution.md`
