# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: implement
tarea_actual: T007
estado_tarea: en_progreso

## Siguiente paso

T007: verificar en el navegador con next dev + NEXT_PUBLIC_API_URL del gateway, en 1440×900 y 375×812: barra y mapa sin scroll; clic en el punto del reporte 01a12d63 → panel derecho con imagen y descripción, resaltado azul; Esc/cerrar; Ver en el histórico; volver al mapa desde el formulario con la última vista.

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
