# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 004-captcha-reporte
fase: implement
tarea_actual: T005
estado_tarea: -

## Siguiente paso

T005: prueba en el navegador.

## Contexto de trabajo

- Sitio: https://dfa8690dowmry.cloudfront.net (CloudFront E30PXSSQODNQGQ, sin WAF). Gateway en SSM /urban-alert/plataforma/api-endpoint.
- Desarrollo local contra el gateway: `.env.local` con NEXT_PUBLIC_API_URL (ignorado) y `npx next dev -p 3930`.
- Panel del navegador: con viewports emulados mayores que el panel, los clics usan otro marco que la captura; usar el tamaño nativo o calcular la posición con JS.

- iCloud deja copias "* 3" en .next/cache/turbopack que rompen el build: moverlas al scratchpad (duplicados-icloud-web).

## Bloqueos / preguntas abiertas

- ninguno
