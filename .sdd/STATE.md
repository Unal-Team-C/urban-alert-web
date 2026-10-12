# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: implement
tarea_actual: T014
estado_tarea: hecha

## Siguiente paso

HU-5 (T011–T012) y HU-6 (T014) implementadas y verificadas en navegador. Falta publicar: push con permiso del usuario; después cerrar T013 y T015 comprobando en https://dfa8690dowmry.cloudfront.net (Teusaquillo, paneo libre, Reiniciar mapa, Histórico, Volver al inicio).

## Contexto de trabajo

- Sitio: https://dfa8690dowmry.cloudfront.net (CloudFront E30PXSSQODNQGQ, sin WAF). Gateway en SSM /urban-alert/plataforma/api-endpoint.
- Desarrollo local contra el gateway: `.env.local` con NEXT_PUBLIC_API_URL (ignorado) y `npx next dev -p 3930`.
- Panel del navegador: con viewports emulados mayores que el panel, los clics usan otro marco que la captura; usar el tamaño nativo o calcular la posición con JS.

## Bloqueos / preguntas abiertas

- ninguno
