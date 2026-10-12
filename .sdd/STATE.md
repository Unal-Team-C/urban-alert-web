# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 003-identidad-sitio
fase: implement
tarea_actual: T003
estado_tarea: en_progreso

## Siguiente paso

T003: recortar el pin de specs/002-rediseno-mapa/fuentes/logo-urbanalert.png con sips → app/icon.png 512, app/apple-icon.png 180, app/favicon.ico 32; borrar public/{file,globe,next,vercel,window}.svg. Verifica: build con <link rel=icon>/apple-touch-icon; grep -r 'Create Next App' out vacío.

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
