# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: implement
tarea_actual: T005
estado_tarea: en_progreso

## Siguiente paso

T005: app/components/VistaPrincipal.tsx (barra + mapa + PanelDano responsive; usuarios una vez; seleccionado; foco al mapa al cerrar; guardarUltimaVista + replaceState) usada por app/page.tsx y app/mapa/page.tsx; app/mapa/layout.tsx sin h-screen; app/page.test.tsx (barra, Crear reporte, sin iframe).

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
