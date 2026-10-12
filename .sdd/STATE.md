# Estado SDD

<!-- Puntero de reanudación. Claude lo actualiza en CADA transición (inicio/fin de tarea, cambio de fase, decisión, bloqueo).
     Editar este archivo = checkpoint (lo registra el hook). Mantenlo corto: el detalle va en specs/ y journal.md.
     fase: constitution | specify | clarify | plan | tasks | implement | verify | done
     estado_tarea: en_progreso | en_progreso | hecha | bloqueada -->

feature_activa: 002-rediseno-mapa
fase: done
tarea_actual: -
estado_tarea: -

## Siguiente paso

002 y 003 implementadas y publicadas en https://dfa8690dowmry.cloudfront.net. Pendientes opcionales: /sdd-verify de 001, 002 y 003 (verify.md); 001 T015 (Deprovision + Provision) solo con autorización expresa. Sin trabajo en curso.

## Contexto de trabajo

- Sitio: https://dfa8690dowmry.cloudfront.net (CloudFront E30PXSSQODNQGQ, sin WAF). Gateway en SSM /urban-alert/plataforma/api-endpoint.
- Desarrollo local contra el gateway: `.env.local` con NEXT_PUBLIC_API_URL (ignorado) y `npx next dev -p 3930`.
- Panel del navegador: con viewports emulados mayores que el panel, los clics usan otro marco que la captura; usar el tamaño nativo o calcular la posición con JS.

## Bloqueos / preguntas abiertas

- ninguno
