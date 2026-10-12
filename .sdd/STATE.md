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

Esperando al usuario: (a) aprobación de specs/002-rediseno-mapa y specs/003-identidad-sitio; (b) permiso de push para 001 T021 (CloudFront) + T022 (WAF básico D-013, ~9 USD/mes), ambas implementadas y probadas en local (11 runs de terraform test). Tras el push: Provision crea WAF + distribución, elimina la Lambda; verificar smoke, web ACL asociada y el sitio en la nueva URL.

## Contexto de trabajo

- Código actual: `/` = bienvenida con /mapa en iframe; app/mapa/components/MapaDanos.tsx (Leaflet, burbujas por localidad, puntos desde zoom 15, Popup con DetalleDano); app/reportes/nuevo/page.tsx (formulario, botón de usuario arriba a la derecha); specs/mapa-functional-spec.md describe el mapa actual.

## Bloqueos / preguntas abiertas

- ninguno
