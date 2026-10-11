# Especificación: Migración del frontend web a AWS

- **ID**: 001-migracion-aws
- **Estado**: aprobada <!-- borrador | aclarada | aprobada | implementada -->
- **Creada**: 2026-10-11
- **Entrada original**: "Ok now we must migrate the service to aws, this service will be the frontend that consumes the api gateway services." → recomendación aceptada: sitio estático en S3 servido por CloudFront. "Yes, do the code changes first. Change the routes so they consume the api gateway, i don't know if you can do it dynamicly, then Terraform". Fuentes en `fuentes/`: README y guía de integración de `urban-alert-plataforma`.

## 1. Resumen

Publicar el frontend de UrbanAlert (portal de reportes, mapa de daños e histórico) en AWS como un sitio estático, sin servidor de aplicación, con una URL pública HTTPS. El navegador llama directamente al API Gateway compartido de la plataforma, cuya dirección se obtiene del contrato de la plataforma en cada despliegue, sin copiarla a mano. La infraestructura queda como código y se aprovisiona y publica con GitHub Actions en cada commit a `main`; otro flujo, manual, la elimina.

## 2. Problema y contexto

- Hoy el frontend solo corre en local (`npm run dev` o el compose del monorepo), detrás del gateway Nginx o reenviando `/api/v1/*` a cada servicio desde el propio servidor de Next.js.
- Los microservicios ya están (o se están) desplegando en AWS detrás del API Gateway compartido (`fuentes/plataforma-README.md`), con las mismas rutas públicas `/api/v1/<servicio>/` que el gateway local. El gateway gestiona CORS (orígenes `*`) y la plataforma prevé que el frontend tenga su propia URL y llame al gateway (`fuentes/plataforma-README.md`, tabla Local → AWS).
- Toda la aplicación se ejecuta en el navegador: no hay lógica de servidor salvo el reenvío de `/api/v1/*`, que en AWS sustituye el gateway. Un servidor de aplicación sería coste y operación sin función.
- Hay una ruta con un segmento variable (detalle de un reporte del histórico) que no puede generarse por adelantado porque los identificadores solo se conocen en tiempo de ejecución.

## 3. Usuarios y actores

- **Ciudadano / administrador**: usar el portal desde una URL pública con su navegador.
- **Equipo de desarrollo**: publicar cambios con un commit a `main`, desarrollar en local como hasta ahora y eliminar el entorno a mano cuando no se usa.
- **Revisor / docente**: entender desde el repositorio qué infraestructura existe, cuánto cuesta y cómo se despliega.

## 4. Historias de usuario

### HU-1: Usar el portal desde una URL pública (Prioridad: P1)

Como usuario quiero abrir el portal desde una URL HTTPS pública y que cada página cargue sus datos de los microservicios desplegados en AWS.

**Criterios de aceptación**
1. Dado el sitio publicado, cuando abro la página de inicio, el mapa, el histórico o el formulario de nuevo reporte, entonces la página carga y sus datos llegan del API Gateway compartido.
2. Dado el sitio publicado, cuando envío un reporte nuevo, entonces se crea a través del gateway y veo la confirmación.
3. Dada una URL `http://`, cuando la abro, entonces se me redirige a `https://`.

### HU-2: Enlaces directos y recarga (Prioridad: P1)

Como administrador quiero poder compartir o recargar el enlace del detalle de un reporte, o de cualquier página, y llegar a la misma vista.

**Criterios de aceptación**
1. Dado el enlace del detalle de un reporte existente, cuando lo abro en una pestaña nueva o recargo, entonces veo ese reporte.
2. Dado el enlace del detalle con un identificador que no existe, cuando lo abro, entonces veo «Reporte no encontrado».
3. Dada una ruta que no pertenece a la aplicación, cuando la abro, entonces veo la página de «no encontrado» y la respuesta HTTP es 404.

### HU-3: Publicar con un commit a `main` (Prioridad: P1)

Como integrante del equipo quiero que un commit a `main` pruebe, aprovisione y publique el sitio de ese commit, sin pasos manuales.

**Criterios de aceptación**
1. Dado un commit a `main`, cuando termina el flujo, entonces la URL pública sirve la versión de ese commit en ≤ 15 minutos desde el inicio del flujo.
2. Dado un commit que hace fallar las pruebas, el lint o el build, cuando se ejecuta el flujo, entonces no se modifica la infraestructura ni el sitio publicado.
3. Dado un commit sin cambios de infraestructura, cuando se ejecuta el flujo, entonces el aprovisionamiento informa de 0 cambios y solo se republica el contenido.
4. Dado que la plataforma cambió la URL del gateway (se recreó), cuando vuelve a ejecutarse el flujo, entonces el sitio publicado llama a la nueva URL sin editar nada en el repositorio.
5. Dados dos commits seguidos, cuando sus flujos coinciden, entonces se ejecutan uno detrás de otro.

### HU-4: Desaprovisionar a mano (Prioridad: P2)

Como integrante del equipo quiero eliminar todo lo que crea este repo con un flujo manual que exija confirmación escrita.

**Criterios de aceptación**
1. Dado el flujo manual con la confirmación `urban-alert-web`, cuando se ejecuta, entonces se eliminan todos los recursos de este repo (incluido el contenido publicado) y nada de la plataforma ni de otros servicios.
2. Dado el flujo manual sin la confirmación exacta, cuando se ejecuta, entonces no elimina nada.

### HU-5: Desarrollo local sin cambios de hábitos (Prioridad: P2)

Como desarrollador quiero seguir ejecutando el frontend en local contra los servicios locales sin configurar CORS.

**Criterios de aceptación**
1. Dado `npm run dev` con los servicios locales levantados, cuando uso la aplicación, entonces las llamadas `/api/v1/*` llegan a cada servicio como hasta ahora.

### Casos borde

- La plataforma no está aprovisionada (no existe su contrato): el flujo falla al principio, antes de cambiar nada, con un mensaje claro.
- Un microservicio no está desplegado: su ruta en el gateway responde 404/503 y la página muestra el error con opción de reintentar (comportamiento actual), sin romper el resto del sitio.
- Crear un usuario desde el portal: el gateway exige firma de AWS en `POST /api/v1/usuarios` (decisión aceptada en la spec 001 de `urban-alert-usuarios`); el portal muestra el mensaje de error y no se queda colgado.
- Un usuario con la versión anterior en caché tras una publicación: al recargar recibe la nueva; los recursos con nombre versionado de la versión anterior siguen disponibles hasta la siguiente publicación para no romper pestañas abiertas.

## 5. Requisitos funcionales

- **RF-001**: El frontend DEBE publicarse como un conjunto de archivos estáticos, sin servidor de aplicación en ejecución.
- **RF-002**: Todas las llamadas del navegador a los microservicios DEBEN ir al API Gateway compartido, usando las mismas rutas públicas `/api/v1/reportes`, `/api/v1/usuarios`, `/api/v1/geoespacial`, `/api/v1/auditoria` que hoy _(fuente: plataforma-integracion.md §4)_.
- **RF-003**: La dirección del gateway DEBE obtenerse del contrato de la plataforma (`/urban-alert/plataforma/api-endpoint`) en cada despliegue; no DEBE figurar escrita en el repositorio _(fuente: plataforma-integracion.md §1)_.
- **RF-004**: El detalle de un reporte DEBE tener una URL que funcione al abrirla directamente o recargarla, con el identificador del reporte en la URL.
- **RF-005**: Toda página de la aplicación DEBE poder abrirse directamente por su URL; una ruta inexistente DEBE mostrar la página «no encontrado» con estado HTTP 404.
- **RF-006**: El sitio DEBE servirse solo por HTTPS; las peticiones HTTP DEBEN redirigirse a HTTPS.
- **RF-007**: El almacenamiento de los archivos DEBE ser privado: solo la red de distribución del sitio puede leerlo.
- **RF-008**: Cada commit a `main` DEBE ejecutar, en orden: pruebas, lint y build → comprobación de la plataforma → aprovisionamiento → build con la URL del gateway → publicación → invalidación de caché → prueba de humo. Si un paso falla, los siguientes no se ejecutan.
- **RF-009**: La prueba de humo DEBE comprobar que la URL pública responde 200 en `/`, `/mapa/`, `/historial/` y el detalle de reporte, 404 en una ruta inexistente, y que el JavaScript publicado contiene la URL del gateway.
- **RF-010**: DEBE existir un flujo manual de desaprovisionamiento que exija escribir `urban-alert-web` y elimine solo los recursos de este repo.
- **RF-011**: Los flujos de aprovisionamiento y desaprovisionamiento DEBEN serializarse y no cancelarse entre sí.
- **RF-012**: Los flujos DEBEN autenticarse en AWS solo con credenciales temporales (OIDC).
- **RF-013**: En desarrollo local (`npm run dev`), sin URL de gateway configurada, las llamadas `/api/v1/*` DEBEN seguir reenviándose a los servicios locales.
- **RF-014**: El README DEBE documentar la URL pública, la arquitectura, la tabla de costes, el arranque manual (política del rol, secreto y variable de GitHub) y los flujos.

## 6. Requisitos no funcionales

- **RNF-001** (rendimiento): los recursos con nombre versionado se sirven con caché de 1 año; las páginas HTML se revalidan en cada visita, de modo que una publicación se ve al recargar.
- **RNF-002** (seguridad): las respuestas incluyen cabeceras de seguridad estándar (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`).
- **RNF-003** (coste): el coste mensual sin tráfico relevante es ≤ 1 USD (sin recursos con coste por hora).
- **RNF-004** (calidad): las 97 pruebas actuales siguen en verde, con pruebas nuevas para la construcción de URL del gateway y el detalle por URL.

## 7. Entidades clave

No aplica: el frontend no almacena datos.

## 8. Fuera de alcance

- Dominio propio y certificado propio (se usa la URL de la red de distribución, como el gateway usa la suya).
- Autenticación de usuarios y firma de peticiones desde el navegador; por tanto, crear usuarios desde el portal por el gateway (aceptado en la spec 001 de `urban-alert-usuarios`).
- Restringir el CORS del gateway al origen del sitio: pertenece a `urban-alert-plataforma` (`cors_origenes`); se deja como recomendación.
- WAF, varios entornos, renderizado en servidor.

## 9. Supuestos

- La plataforma compartida está aprovisionada y publica `/urban-alert/plataforma/api-endpoint`.
- El gateway mantiene CORS con orígenes `*` (o incluye el origen del sitio) y las rutas públicas actuales de cada servicio.
- Un administrador de la cuenta puede crear y adjuntar al rol de GitHub una política nueva para la red de distribución (el rol actual no tiene esos permisos); se versiona en este repo.
- El repo es `Unal-Team-C/urban-alert-web` y el rol OIDC ya confía en `main` de los repos de la organización.

## 10. Métricas de éxito

- **MS-001**: Tras un commit a `main`, el flujo termina en verde y las cuatro páginas cargan datos reales del gateway desde la URL pública.
- **MS-002**: Abrir directamente el enlace del detalle de un reporte existente muestra el reporte.
- **MS-003**: Un segundo Provision sobre el mismo commit informa de 0 cambios de infraestructura.
- **MS-004**: Deprovision con confirmación deja la cuenta sin recursos `urban-alert-web` y la plataforma intacta.

## 11. Clarificaciones

### Sesión 2026-10-11
- P: ¿Servidor Next.js o sitio estático? → R: sitio estático en S3 + CloudFront (recomendación aceptada por el usuario).
- P: ¿Cómo apunta el frontend al gateway «dinámicamente»? → R: la URL se lee del contrato SSM de la plataforma en cada despliegue y se incrusta en el build (ver plan D-002).

---

### Checklist de calidad (autorrevisión antes de entregar)

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs, estructura de código) — salvo los nombres del contrato de la plataforma y la decisión de alojamiento, que tomó el usuario
- [x] Cada requisito es testeable y no ambiguo
- [x] Criterios de aceptación con resultado observable
- [x] Casos borde identificados
- [x] Alcance acotado (fuera de alcance explícito)
- [x] Como máximo 3 `[NEEDS CLARIFICATION]` pendientes
- [x] Coherente con `.sdd/constitution.md`
