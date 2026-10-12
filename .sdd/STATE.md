# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: implement
tarea_actual: T003
estado_tarea: en_progreso

## Siguiente paso

T003: PanelDano (sustituye DetalleDano): aside con título, botón «Cerrar detalle», Esc, foco al abrir; campos + Reportado por (usuarios, nombreDeUsuario) + Ver en el histórico (/historial/detalle?id=) + imagen ancha; estados cargando/404/error. Pruebas migradas de DetalleDano.test y ampliadas; borrar DetalleDano.*

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
