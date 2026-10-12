# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: specify
tarea_actual: -
estado_tarea: -

## Siguiente paso

Specs en borrador: specs/002-rediseno-mapa/spec.md (mapa a pantalla completa, barra superior, panel derecho, volver al mapa) y specs/003-identidad-sitio/spec.md (título, descripción, lang es, favicon; separada a petición del usuario). Esperar aprobación de ambas; luego /sdd-plan de 002 (activa) y de 003. 001: T021 commiteada, pendiente de push con permiso (notes.md de 001).

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
