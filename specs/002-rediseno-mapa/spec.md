# Especificación: Rediseño del mapa como vista principal

- **ID**: 002-rediseno-mapa
- **Estado**: implementada <!-- borrador | aclarada | aprobada | implementada -->
- **Creada**: 2026-10-12
- **Entrada original**: "Also i want to change some ui ux , First when you click a point in the map, the description of the case should appear on the right side of the map, something like this: [captura de FixMyStreet] The map should occupy all the viewpoint, let´s have the icon i put in an upper menu at one of the ends and at the oposite the button to create a report. There must be also a button when creating a report that takes you back to the map." Fuentes en `fuentes/`: `referencia-fixmystreet.webp` (detalle de un caso en un panel lateral junto al mapa) y `logo-urbanalert.png` (logo de UrbanAlert).

## 1. Resumen

La página principal pasa a ser el mapa de daños a pantalla completa, bajo una barra superior con el logo de UrbanAlert en un extremo y el botón «Crear reporte» en el otro. Al pulsar un daño en el mapa, su información aparece en un panel a la derecha del mapa (como en FixMyStreet) en lugar de un globo sobre el punto. El formulario de nuevo reporte tiene un botón para volver al mapa.

## 2. Problema y contexto

- Hoy `/` es una tarjeta de bienvenida con el mapa embebido en un recuadro (iframe del 60 % del alto) y un botón debajo: el mapa, que es lo principal, se ve pequeño y con bordes.
- La información de un daño se muestra en un globo de 256 px anclado al punto: tapa el mapa alrededor, la imagen se ve diminuta y la descripción larga obliga a desplazarse dentro del globo.
- Desde el formulario (`/reportes/nuevo`) no hay forma visible de volver al mapa: solo el botón «atrás» del navegador.
- La aplicación no muestra el logo de UrbanAlert en ninguna página.
- El comportamiento actual del mapa (burbujas por localidad, puntos desde el nivel de calle, vista en la URL) está descrito en `specs/mapa-functional-spec.md` y se conserva.

## 3. Usuarios y actores

- **Ciudadano**: ver qué daños hay en su zona, revisar uno concreto y reportar uno nuevo.
- **Administrador**: revisar daños desde el mapa y pasar a su ficha completa en el histórico.

## 4. Historias de usuario

### HU-1: El mapa ocupa toda la pantalla bajo una barra superior (Prioridad: P1)

Como usuario quiero que la página principal sea el mapa a pantalla completa, con la marca de UrbanAlert y el acceso a crear un reporte siempre a la vista.

**Criterios de aceptación**
1. Dado que abro `/`, entonces veo una barra superior con el logo de UrbanAlert en el extremo izquierdo y el botón «Crear reporte» en el extremo derecho, y debajo el mapa ocupando todo el resto de la ventana, sin márgenes, tarjeta ni recuadro, y sin barra de desplazamiento de la página.
2. Dado el mapa a pantalla completa, cuando lo uso, entonces todo lo que hace hoy sigue funcionando igual: burbujas por localidad, puntos desde el nivel de calle, avisos de carga y error, y la vista (`lat`, `lon`, `zoom`) reflejada en la URL de `/`.
3. Dado que cambio el tamaño de la ventana, entonces el mapa se ajusta al nuevo tamaño sin dejar zonas en blanco.
4. Dado que pulso «Crear reporte», entonces voy al formulario de nuevo reporte.
5. Dado que pulso el logo, entonces voy a la página principal.
6. Dado un enlace antiguo a `/mapa` (con o sin `lat`, `lon`, `zoom`), cuando lo abro, entonces veo la misma vista principal en esa posición.

### HU-2: El detalle de un daño aparece en un panel a la derecha (Prioridad: P1)

Como usuario quiero que al pulsar un daño su información aparezca en un panel junto al mapa, para leerla cómodamente sin que tape el mapa.

**Criterios de aceptación**
1. Dado el mapa a nivel de calle, cuando pulso un punto, entonces se abre a la derecha un panel de la altura del mapa con: tipo de daño (como título), categoría, estado, nivel de emergencia, fecha, quién lo reportó, descripción completa, imagen (si tiene) a todo el ancho del panel, y coordenadas. No aparece ningún globo sobre el punto.
2. Dado el panel abierto, entonces el punto pulsado se distingue visualmente de los demás, y el mapa sigue siendo usable (mover, acercar, pulsar otros puntos) en el espacio que queda.
3. Dado el panel abierto, cuando pulso otro punto, entonces el panel muestra el nuevo daño y el resaltado pasa al nuevo punto.
4. Dado el panel abierto, cuando pulso el botón de cerrar o la tecla Esc, entonces el panel se cierra, el resaltado desaparece y el mapa recupera todo el ancho.
5. Dado el panel abierto, cuando pulso «Ver en el histórico», entonces voy a la ficha completa del reporte (`/historial/detalle/?id=<id>`).
6. Dado que pulso un punto, mientras llega su información, entonces el panel muestra «Cargando daño...»; si no hay reporte para ese punto, muestra «No hay un reporte registrado para este punto»; ante otro error, muestra el mensaje y un botón «Reintentar», dentro del panel.
7. Dado que la información se pide al pulsar el punto, entonces no se piden datos de reportes que no se han pulsado.
8. Dada una pantalla estrecha (menos de 768 px de ancho), cuando pulso un punto, entonces el panel aparece en la parte inferior de la pantalla, ocupando como máximo el 60 % del alto, con desplazamiento propio y el mismo botón de cerrar.

### HU-3: Volver al mapa desde el formulario (Prioridad: P1)

Como usuario quiero un botón para volver al mapa mientras creo un reporte.

**Criterios de aceptación**
1. Dado que estoy en `/reportes/nuevo`, entonces veo la misma barra superior (logo a la izquierda) con un botón «Volver al mapa» visible sin desplazarme, y el selector de usuario sigue disponible.
2. Dado que pulso «Volver al mapa», entonces voy a la página principal y el mapa se abre en la última vista que tenía en este navegador.
3. Dado que acabo de crear un reporte, cuando aparece la confirmación, entonces puedo volver al mapa desde ella, además de cerrarla para crear otro.

### HU-5: Vista inicial en Teusaquillo, paneo libre y reinicio (Prioridad: P2, enmienda 2026-10-13)

Como usuario quiero que el mapa abra centrado en Teusaquillo, moverlo sin límites y volver a la vista inicial con un botón.

**Criterios de aceptación**
1. Dado que abro `/` sin vista en la URL, entonces el mapa se centra en Teusaquillo con el zoom de ciudad actual.
2. Dado el mapa, cuando lo arrastro, entonces puedo llevarlo fuera de Bogotá sin que rebote; fuera de Bogotá no hay daños que mostrar y no aparecen errores.
3. Dado el mapa, entonces veo un botón «Reiniciar mapa» junto a los controles de zoom; al pulsarlo, el mapa vuelve a la vista inicial (Teusaquillo, zoom de ciudad). Si hay un daño abierto en el panel, sigue abierto.
4. Dada una vista fuera de Bogotá en la URL (al recargar o compartir), entonces el mapa abre en esa vista.

### HU-6: Navegar entre el mapa y el histórico (Prioridad: P2, enmienda 2026-10-13)

Como administrador quiero pasar del mapa al histórico y volver al inicio desde el histórico y desde el detalle de un reporte.

**Criterios de aceptación**
1. Dada la página principal, entonces la barra superior tiene un enlace «Histórico» que lleva a `/historial`, además de «Crear reporte».
2. Dado `/historial`, entonces veo la barra superior con un botón «Volver al inicio» que abre el mapa en su última vista.
3. Dado el detalle de un reporte, entonces veo la misma barra con «Volver al inicio», además del enlace «← Volver al histórico» que ya tiene.

### Casos borde

- Pulsar un punto cuyo reporte no existe (datos de prueba de Geoespacial): mensaje de «no hay reporte» en el panel (HU-2.6).
- Pulsar un punto que queda tapado por el panel al abrirse: el mapa se desplaza lo justo para que el punto siga visible.
- Alejar el mapa por debajo del nivel de calle con el panel abierto: los puntos pasan a burbujas; el panel sigue mostrando el daño hasta que se cierre.
- El reporte no tiene imagen o su URL falla: el panel no muestra hueco ni icono roto (como hoy).
- El servicio de Usuarios falla: «Reportado por» muestra el inicio del identificador, como en el histórico; el resto del panel funciona.
- Volver al mapa sin haberlo visitado antes en este navegador: se abre en la vista por defecto de Bogotá.
- Salir del formulario a medias con «Volver al mapa»: los datos sin enviar se pierden, igual que con el botón «atrás» (no se pide confirmación).

## 5. Requisitos funcionales

- **RF-001**: La página principal (`/`) DEBE mostrar una barra superior fija con el logo de UrbanAlert (enlace a `/`) en el extremo izquierdo y el botón «Crear reporte» (enlace a `/reportes/nuevo`) en el extremo derecho _(fuente: petición del usuario)_.
- **RF-002**: El mapa DEBE ocupar todo el espacio de la ventana bajo la barra superior, sin márgenes, tarjeta ni iframe, sin desplazamiento de la página, y ajustarse al cambiar el tamaño de la ventana _(fuente: petición del usuario)_.
- **RF-003**: El comportamiento del mapa descrito en `specs/mapa-functional-spec.md` (US-M01, M02, M03, M05) DEBE conservarse en la página principal; la vista DEBE reflejarse en la URL de `/`.
- **RF-004**: `/mapa` DEBE seguir funcionando y mostrar la vista principal, respetando `lat`, `lon` y `zoom`.
- **RF-005**: Pulsar un punto DEBE abrir un panel a la derecha del mapa con tipo, categoría, estado, nivel de emergencia, fecha, nombre de quien reportó, descripción completa, imagen a todo el ancho y coordenadas, en lugar del globo actual _(fuente: petición del usuario y referencia FixMyStreet)_.
- **RF-006**: El punto seleccionado DEBE distinguirse de los demás mientras el panel esté abierto; pulsar otro punto DEBE reemplazar el contenido.
- **RF-007**: El panel DEBE cerrarse con un botón de cerrar y con la tecla Esc; al cerrarse, el mapa DEBE recuperar todo el ancho.
- **RF-008**: El panel DEBE ofrecer un enlace «Ver en el histórico» a `/historial/detalle/?id=<id>`.
- **RF-009**: El panel DEBE mostrar los estados de carga, «sin reporte» y error con reintento, sin afectar al resto del mapa.
- **RF-010**: Con menos de 768 px de ancho, el panel DEBE mostrarse en la parte inferior, con un alto máximo del 60 % y desplazamiento propio.
- **RF-011**: El formulario de nuevo reporte DEBE mostrar la barra superior con un botón «Volver al mapa» visible sin desplazarse, conservando el selector de usuario _(fuente: petición del usuario)_.
- **RF-012**: «Volver al mapa» DEBE abrir la página principal en la última vista del mapa guardada en este navegador, o en la vista por defecto si no hay ninguna.
- **RF-013**: La confirmación de reporte creado DEBE ofrecer volver al mapa además de cerrarla.
- **RF-015**: La vista inicial del mapa DEBE estar centrada en Teusaquillo (punto de su etiqueta en las localidades) con el zoom de ciudad _(fuente: usuario, 2026-10-13)_.
- **RF-016**: El mapa principal NO DEBE limitar el paneo a Bogotá; las consultas a Geoespacial DEBEN seguir limitadas al rango de Bogotá. El selector de ubicación del formulario conserva sus límites _(fuente: usuario)_.
- **RF-017**: El mapa DEBE tener un botón «Reiniciar mapa» junto a los controles de zoom que vuelva a la vista inicial sin cerrar el panel _(fuente: usuario)_.
- **RF-019**: La barra superior de la página principal DEBE incluir un enlace «Histórico» a `/historial` _(fuente: usuario, 2026-10-13)_.
- **RF-020**: `/historial` y su detalle DEBEN mostrar la barra superior con «Volver al inicio», que abre el mapa en su última vista (como RF-012) _(fuente: usuario)_.
- **RF-018**: Una vista válida (latitud y longitud dentro de sus rangos) en la URL DEBE respetarse aunque esté fuera de Bogotá.

## 6. Requisitos no funcionales

- **RNF-001** (accesibilidad): el panel se anuncia como región con título; el botón de cerrar tiene nombre accesible; la tecla Esc lo cierra; el foco pasa al panel al abrirse y vuelve al mapa al cerrarse.
- **RNF-002** (rendimiento): abrir el panel no vuelve a pedir los daños del mapa; solo pide el reporte pulsado (y la lista de usuarios una vez).
- **RNF-003** (calidad): las pruebas actuales del mapa, el histórico y el formulario siguen en verde, con pruebas nuevas para el panel, la barra superior y el botón de volver.
- **RNF-004** (compatibilidad): sin cambios en los servicios ni en el gateway; el sitio sigue siendo una exportación estática (constitución, stack).

## 7. Entidades clave

No hay entidades nuevas: se usan el reporte (Reportes), el usuario que lo creó (Usuarios) y la coordenada del punto (Geoespacial), como hoy.

## 8. Fuera de alcance

- Cambiar el contenido de `/historial` y su detalle (solo ganan la barra superior con «Volver al inicio», HU-6).
- Título de la pestaña, idioma del documento e icono del sitio: spec `003-identidad-sitio`.
- Que la URL refleje el daño seleccionado (abrir `/` con un daño ya abierto).
- Filtros en el mapa, búsqueda de direcciones, actualizaciones o comentarios sobre un daño (lo que FixMyStreet ofrece debajo del detalle).
- Cambiar el contenido o las validaciones del formulario.
- Modo oscuro propio (se mantienen los colores fijos actuales).

## 9. Supuestos

- El logo va a la izquierda y «Crear reporte» a la derecha (el usuario dejó elegir el extremo; es la convención habitual de lectura).
- El panel va a la derecha, como pidió el usuario, aunque la referencia de FixMyStreet lo tiene a la izquierda.
- En pantallas estrechas no cabe un panel lateral útil: se usa una hoja inferior (HU-2.8).
- La «última vista del mapa» se guarda en el propio navegador; si no se puede guardar (modo privado), se usa la vista por defecto.
- El logo proporcionado (`fuentes/logo-urbanalert.png`, 390 × 296) es el oficial y puede publicarse en el sitio.

## 10. Métricas de éxito

- **MS-001**: En el sitio publicado, `/` muestra la barra y el mapa a pantalla completa, sin desplazamiento, en 1440 × 900 y en 375 × 812.
- **MS-002**: Pulsar el reporte de prueba existente abre el panel a la derecha con su imagen y descripción completas, y «Ver en el histórico» lleva a su ficha.
- **MS-003**: Desde el formulario, «Volver al mapa» devuelve a la última vista del mapa con un clic.

## 11. Clarificaciones

<!-- /sdd-clarify añade aquí:
### Sesión AAAA-MM-DD
- P: … → R: … -->

### Sesión 2026-10-13
- P: (usuario) «Center the map with teusaquillo as the center and let me pan it freely. Add a button that says reiniciar mapa that resets the view» → R: HU-5, RF-015–RF-018 (enmienda aprobada por la propia petición). Zoom inicial sin cambios (ciudad); el botón no cierra el panel; vistas fuera de Bogotá en la URL se respetan (sustituye la regla de US-M05 de `specs/mapa-functional-spec.md`).
- P: (usuario) «En historial dame un botón para volver al inicio, en el detalle de un reporte dame igualmente un botón para volver al inicio. En la barra del inicio de mapas agrega un modo en la barra superior para ir a historial» → R: HU-6, RF-019–RF-020 (aprobada por la propia petición). «Volver al inicio» usa la última vista del mapa; se pone en el layout de `/historial`, que comparte el detalle.

---

### Checklist de calidad (autorrevisión antes de entregar)

- [x] Sin detalles de implementación (lenguajes, frameworks, APIs, estructura de código)
- [x] Cada requisito es testeable y no ambiguo
- [x] Criterios de aceptación con resultado observable
- [x] Casos borde identificados
- [x] Alcance acotado (fuera de alcance explícito)
- [x] Como máximo 3 `[NEEDS CLARIFICATION]` pendientes (ninguno: las decisiones abiertas están en Supuestos)
- [x] Coherente con `.sdd/constitution.md`
