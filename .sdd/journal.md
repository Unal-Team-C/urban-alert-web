# Journal SDD

<!-- Bitácora append-only: añade entradas AL FINAL, no reescribas las anteriores.
     Formato:
     ## AAAA-MM-DD · <feature o "general"> · <evento>
     - detalle (qué, por qué, archivos, verificación)
     Las horas exactas de cada edición/checkpoint quedan en .sdd/activity.log. -->

## 2026-10-11 · general · arnés instalado
- Copiado de `urban-alert-plataforma` (las carpetas .sdd/.claude llegaron vacías). STATE y journal reiniciados.
- Constitución 1.0.0 adaptada de `urban-alert-usuarios` al frontend estático (P1–P10).

## 2026-10-11 · 001-migracion-aws · spec, plan y tareas en borrador
- Decisión del usuario: sitio estático en S3 + CloudFront (no servidor Next).
- URL del gateway: SSM `api-endpoint` → `NEXT_PUBLIC_API_URL` en el build (D-002); detalle a `/historial/detalle/?id=` (D-003).
- Hallazgo: `POST /api/v1/usuarios` es AWS_IAM en el gateway → 403 desde el navegador (aceptado en la spec de Usuarios; fuera de alcance).
- Hallazgo: el rol de GitHub no tiene permisos de CloudFront → política nueva en infra/bootstrap (D-010).

## 2026-10-11 · 001-migracion-aws · aprobación
- El usuario aprueba spec, plan y tareas («Approved, go ahead with the implementation»). Fase implement.

## 2026-10-11 · 001-migracion-aws · T001 hecha
- Arnés, constitución 1.0.0 y spec/plan/tareas versionados; .gitignore con activity.log, settings.local.json, Terraform; CLAUDE.md importa AGENTS.md y el protocolo.

## 2026-10-11 · 001-migracion-aws · T002 hecha
- urlApi() en app/lib/api.ts (NEXT_PUBLIC_API_URL literal para que Next la sustituya); obtenerJson, usuarios.ts y nuevo/page.tsx la usan. 101 tests en verde, eslint limpio. tsc sin build falla por PageProps/LayoutProps (tipos generados por next build; preexistente).

## 2026-10-11 · 001-migracion-aws · T003 hecha
- Detalle movido a app/historial/detalle (useSearchParams en Suspense; sin id → no encontrado sin llamar a la API). Enlace /historial/detalle?id= (next/link añade la barra con trailingSlash). 103 tests en verde. Las specs antiguas (historico-*) siguen citando /historial/[id]: son historia, no se tocan.

## 2026-10-11 · 001-migracion-aws · T004 hecha
- next.config.ts por fase: build → output export + trailingSlash (out/ con index.html por ruta y 404.html, 1,5 MB); dev → rewrites sin trailingSlash (comprobado con next dev: proxy a localhost:5039). NEXT_PUBLIC_API_URL aparece en out/_next/static. Dockerfile eliminado; .env.example. Gotcha: node no importa next.config.ts directamente (next/constants sin .js); next dev reescribe next-env.d.ts (revertir).

## 2026-10-11 · 001-migracion-aws · T005 hecha
- infra/bootstrap: README (reutiliza OIDC, rol, políticas deploy/platform y bucket de estado; clave web/terraform.tfstate) y github-web-policy.json (CloudFront sobre arn:aws:cloudfront::348364742283:*; List*/políticas gestionadas sobre *). JSON válido. Falta que un administrador la aplique antes de T013.

## 2026-10-11 · 001-migracion-aws · T006 hecha
- Función de índice (cloudfront-js-2.0) y 5 pruebas node:test en verde; eslint limpio (disable puntual: CloudFront invoca handler por nombre).

## 2026-10-11 · 001-migracion-aws · T007 hecha
- Stack infra/web: bucket urban-alert-web-<cuenta> privado (BPA, BucketOwnerEnforced, AES256, force_destroy), política solo cloudfront.amazonaws.com con AWS:SourceArn + deny sin TLS, OAC sigv4/always, función indice, distribución (PriceClass_100, http2and3, redirect-to-https, CachingOptimized, SecurityHeadersPolicy, 403/404 → /404.html 404). Lock aws 6.68.0 con 3 plataformas; validate y fmt OK (Podman, caché ~/.cache/tf-plugins).

## 2026-10-11 · 001-migracion-aws · T008 hecha
- web.tftest.hcl: 5 runs en verde (bucket privado, solo la distribución lee con AWS:SourceArn + deny sin TLS, HTTPS/OAC/certificado/cabeceras, función viewer-request y 403/404 → /404.html, prefijo). Gotchas: list == tuple siempre es false en HCL (usar toset); effect sin fijar es null con mock (se fija Allow en main.tf).

## 2026-10-11 · 001-migracion-aws · T009 hecha
- scripts check-platform.sh (imprime api-endpoint de SSM o falla), publicar-sitio.sh (2 sync + invalidación con wait), smoke-web.sh (páginas 200, ruta inexistente 404, URL del gateway en el JS, cabeceras de caché; --sin-cabeceras en local). shellcheck OK. Verificado con un emulador local de CloudFront (función indice + 404.html, en el scratchpad) sobre out/ con NEXT_PUBLIC_API_URL=https://ejemplo.invalid: smoke en verde y en rojo con otra URL; en el navegador las llamadas van a https://ejemplo.invalid/api/v1/..., la navegación de cliente (RSC .txt) funciona y el detalle sin id muestra no encontrado.

## 2026-10-11 · 001-migracion-aws · T010 hecha
- provision.yml: job test (Node 24: npm ci, lint, test, build; node --test; terraform fmt/validate/test; actionlint; shellcheck) y job provision (OIDC → check-platform imprime api_url → apply infra/web → build con NEXT_PUBLIC_API_URL → publicar-sitio → smoke → resumen). concurrency urban-alert-web-aws. actionlint OK.

## 2026-10-11 · 001-migracion-aws · T011 hecha
- deprovision.yml: confirmación urban-alert-web, solo main, destroy de infra/web (omite si el estado está vacío), comparte concurrency con Provision. actionlint OK.

## 2026-10-11 · 001-migracion-aws · T012 hecha
- README reescrito (arquitectura, URL desde site_url, workflows, caché, costes ~0 USD, arranque, desarrollo y validación local, limitaciones POST usuarios/CORS) y CLAUDE.md con estructura y gotchas. Enlaces relativos comprobados. Validación completa: lint, 103 tests, build, 5 pruebas de la función.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada
- T001–T012 hechas y commiteadas en local (sin push). T013 espera al usuario: política de CloudFront (administrador), AWS_ROLE_ARN/AWS_REGION en GitHub y push a main.

## 2026-10-11 · 001-migracion-aws · T013 push
- Push de main (66679bb..e4c350d) autorizado por el usuario. Provision run 38180467808.

## 2026-10-11 · 001-migracion-aws · T013 corrección
- Run 38180467808 falló en el job test: `node --test infra/web/funciones/` en Node 24 trata la carpeta como módulo (MODULE_NOT_FOUND); local (Node 26) pasaba. Se pasa el archivo indice.test.mjs en workflow, README, CLAUDE.md y plan. Nada se tocó en AWS.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada en permisos
- Run 38180550392: tests en verde (incluido Terraform, actionlint, shellcheck en CI), OIDC y check-platform OK; terraform apply falla al leer data.aws_cloudfront_response_headers_policy: AccessDenied en ListResponseHeadersPolicies. La política de infra/bootstrap aún no está adjunta. Sin recursos creados.

## 2026-10-11 · 001-migracion-aws · T013 rerun
- Usuario: política github-actions-urban-alert-web adjunta. Rerun del job fallido del run 38180550392.

## 2026-10-11 · 001-migracion-aws · T013 bloqueada por verificación de cuenta
- Rerun del run 38180550392 con la política adjunta: IAM correcto; se crearon bucket (+BPA, ownership, SSE), OAC y función. CreateDistributionWithTags → 403 «Your account must be verified before you can add new CloudFront resources» (RequestID ddf2a519-094f-49a5-88c6-8f196c739737). Requiere caso en AWS Support; no hay cambio de IAM ni de código que lo resuelva.

## 2026-10-11 · 001-migracion-aws · T016 hecha
- Enmienda D-012 registrada: CloudFront bloqueado por verificación de cuenta → Lambda function URL sobre el bucket privado, sin WAF, conmutada por cdn_habilitado. Aprobada por el usuario («Let's use the lambda only»). WAF descartado (no admite function URLs ni HTTP APIs).

## 2026-10-11 · 001-migracion-aws · T017 hecha
- Origen Lambda (infra/web/origen/index.mjs): crearHandler(leer) con índices, tipos (corrige binary/octet-stream), caché, ETag/304, 404.html, 405, HEAD, cabeceras de seguridad; adaptador S3 con import dinámico del SDK del runtime (403/404 → 404). 10 pruebas node:test en verde, eslint limpio.

## 2026-10-11 · 001-migracion-aws · T018 hecha
- infra/web: cdn_habilitado=false y concurrencia_reservada=-1 en tfvars; CloudFront con count y moved (OAC y función existentes se eliminarán en el próximo apply); lambda.tf (rol con políticas en línea, log group 30 días, archive_file → .build/origen.zip ignorado, nodejs22.x arm64 256 MB, function URL NONE, permisos InvokeFunctionUrl + InvokeFunction con invoked_via_function_url); salidas según variante. Lock con archive 2.8.1. 8 runs de terraform test en verde, fmt/validate OK.

## 2026-10-11 · 001-migracion-aws · T019 hecha
- publicar-sitio.sh sin invalidación con distribución vacía; job test ejecuta las pruebas del origen; README (estado temporal, arquitectura Lambda, costes, cómo volver a CloudFront), CLAUDE.md (gotchas de function URL y políticas en línea), bootstrap (política multimedia verificada en su README: mismo rol; Multimedia ya sufrió el mismo bloqueo de CloudFront, su D-015). shellcheck, actionlint, 15 pruebas node y enlaces OK.

## 2026-10-11 · 001-migracion-aws · T013 push con origen Lambda
- Usuario: «push it». Push de main con T013 (estado) y T016–T019.

## 2026-10-11 · 001-migracion-aws · T013 sitio en línea + T020
- Run 38183970177 en verde: Lambda creada (8 recursos), OAC y función de CloudFront eliminadas, smoke completo. site_url https://etucvhblj4uubyhdwctdaqx3ye0kzriq.lambda-url.us-east-2.on.aws. En el navegador: histórico, catálogo, usuarios y consulta geoespacial responden 200 por el gateway (CORS OK, contexto seguro). Base sin reportes: MS-002 (detalle de un reporte existente) pendiente de que haya datos.
- Fallo: /localidades.geojson se pedía al gateway (obtenerJson aplicaba urlApi a todo). T020: urlApi solo para rutas /api/; 104 tests.

## 2026-10-11 · 001-migracion-aws · T013 hecha
- Primer Provision con origen Lambda: run 38183970177 en verde; tras T020, run 38185133312 en verde. site_url https://etucvhblj4uubyhdwctdaqx3ye0kzriq.lambda-url.us-east-2.on.aws. MS-001 verificado en el navegador: histórico, nuevo reporte (catálogo, usuarios, contexto seguro) y mapa (localidades + 21 daños de Geoespacial) con datos reales del gateway. MS-002 (detalle de un reporte existente): la página /historial/detalle/?id= responde y consulta Reportes; sin reportes en Reportes aún para probar uno real.

## 2026-10-11 · 001-migracion-aws · T014 hecha
- Run 38185133312 (solo cambios de código): terraform apply «No changes. Your infrastructure matches the configuration» → MS-003.

## 2026-10-11 · 001-migracion-aws · prueba de creación de reporte (MS-002)
- A petición del usuario: formulario del sitio real rellenado (Vías y andenes / Grietas en la vía, descripción, punto 4.67719,-74.07171 en el mapa). El panel del navegador no permite adjuntar el archivo (fetch público→127.0.0.1 bloqueado por Local Network Access), así que se envió la misma petición multipart con curl al gateway con la imagen original (test-user).
- Resultado: 503 de Reportes «No fue posible subir la imagen del reporte»: Multimedia responde 503 «Service unavailable» incluso en GET /api/v1/multimedia/images/{id}/metadata (backend DocumentDB caído, ya anotado en el repo de Reportes). No se creó el reporte. Fuera de este repo; MS-002 sigue pendiente de un reporte real.

## 2026-10-11 · 001-migracion-aws · MS-002 verificado
- Con Multimedia de nuevo en línea (el usuario había apagado su DocumentDB), POST /api/v1/reportes por el gateway → 201, reporte 01a12d63-bfea-7d70-bf04-053bd5c41f32 (test-user, Grietas en la vía, 4.67719,-74.07171, imagen en urban-alert-multimedia-images). La descripción quedó cortada en el «;»: lo interpreta curl -F como separador de parámetros (fallo de la prueba, no de la app).
- En site_url: el histórico lista el reporte con enlace /historial/detalle/?id=…; el detalle abre directamente y muestra datos, usuario, mapa (Geoespacial coordinates 200), imagen de S3, línea de tiempo (Auditoría 200) e integridad «Válida». MS-001 y MS-002 cumplidos.

## 2026-10-12 · general · arnés restaurado
- .claude/ y .sdd/ desaparecieron del disco sin commit (git log/reflog/stash sin rastro; posible iCloud o borrado manual). Restaurados con git checkout por indicación del usuario.

## 2026-10-12 · 001-migracion-aws · T021 iniciada
- Usuario: la cuenta ya puede usar CloudFront. Se vuelve a cdn_habilitado = true (D-006/D-012).

## 2026-10-12 · 002-rediseno-mapa · spec en borrador
- Creada desde la petición del usuario (captura de FixMyStreet y logo en fuentes/). Mapa a pantalla completa con barra superior (logo izquierda, Crear reporte derecha), panel derecho con el detalle (hoja inferior < 768 px), Volver al mapa en el formulario y en la confirmación. 001 aparcada en specs/001-migracion-aws/notes.md.

## 2026-10-12 · 003-identidad-sitio · spec en borrador
- A petición del usuario, spec aparte para el título del sitio: títulos por página («<página> · UrbanAlert»), descripción, lang es, favicon del pin del logo, quitar recursos de la plantilla. HU-4/RF-014 retirados de 002.

## 2026-10-12 · 001-migracion-aws · D-013 (WAF básico)
- Usuario: «For cloudfront enable basic security». Enmienda D-013: web ACL en us-east-1 con límite por IP y grupos gestionados IP reputation, Common y Known bad inputs (bloqueo), ~9 USD/mes. T022 en curso.

## 2026-10-12 · 001-migracion-aws · T022 implementada en local
- waf.tf (web ACL CLOUDFRONT en us-east-1 vía proveedor aws.us_east_1; límite 1000/5 min por IP; IpReputation, CommonRuleSet, KnownBadInputs; bloqueo o monitor), web_acl_id en la distribución, 3 runs nuevos (11 en total) en verde, README con coste ~9 USD/mes. Pendiente de push junto con T021.

## 2026-10-12 · 001-migracion-aws · WAF desactivado y push de CloudFront
- Análisis de riesgo para un prototipo de una semana: el riesgo principal (Reportes acepta escrituras públicas sin autenticación) no lo resuelve ni el WAF ni restringir el gateway a CloudFront. Usuario: «only cloudfront without waf». waf_habilitado = false (código y pruebas conservados, 12 runs en verde). T022 cerrada. Push de T021.

## 2026-10-12 · 002-rediseno-mapa y 003-identidad-sitio · specs aprobadas
- Usuario: «Approved both specs, go ahead». Siguiente: plan y tareas de 003 y 002.

## 2026-10-12 · 002/003 · planes y tareas en borrador
- 003: metadatos por layout de sección, lang es, not-found propia, iconos del pin con sips, borrar SVG de la plantilla, smoke con título.
- 002: VistaPrincipal compartida por / y /mapa, BarraSuperior, PanelDano (sustituye DetalleDano/Popup), selección y ResizeObserver en MapaDanos, última vista en localStorage, Volver al mapa en formulario y confirmación.

## 2026-10-12 · 001-migracion-aws · T021 hecha (CloudFront)
- Run 38315937000 en verde: distribución E30PXSSQODNQGQ creada en 2 m 38 s (sin WAF), 7 recursos de la Lambda eliminados, invalidación y smoke completos. site_url https://dfa8690dowmry.cloudfront.net. En el navegador el detalle del reporte real carga (Reportes, catálogo, usuarios, Geoespacial 200; imagen de Multimedia).

## 2026-10-12 · 003-identidad-sitio · planes aprobados, implementación
- Usuario: «Approved both plans, go ahead». Planes y tareas de 002 y 003 aprobados. Feature activa 003 (002 aparcada en su notes.md). T001 en curso.

## 2026-10-12 · 003-identidad-sitio · T001 hecha
- Metadata raíz (default UrbanAlert, template «%s · UrbanAlert», descripción), lang es, títulos por layout de sección. Gotcha: un title de texto en historial/layout cortaba la plantilla para historial/detalle: historial lleva {default, template}. out/: títulos correctos en /, nuevo, historial, detalle, mapa. 107 tests.

## 2026-10-12 · 003-identidad-sitio · T002 hecha
- app/not-found.tsx en español («Página no encontrada», enlace «Ir al mapa») con title; out/404.html «Página no encontrada · UrbanAlert». 109 tests.

## 2026-10-12 · 003-identidad-sitio · T003 hecha
- Iconos del pin (recorte 228 px con sips): app/icon.png 192, app/apple-icon.png 180 opaco sobre blanco, app/favicon.ico 32; SVG de la plantilla borrados. out/index.html con los 3 <link>; ningún archivo de out/ contiene «create next app». Plan D-002 anotado (192 en vez de 512).

## 2026-10-12 · 003-identidad-sitio · T004 hecha
- smoke-web.sh comprueba <title>UrbanAlert</title> y que no haya texto de la plantilla; smoke local contra out/ (emulador de CloudFront) en verde; shellcheck OK. T005 (publicar) se hará con el push conjunto de 002 y 003, con permiso.

## 2026-10-12 · 002-rediseno-mapa · T001 hecha
- public/logo-urbanalert.png y BarraSuperior (header 64 px blanco, logo 48 px enlazado a / con aria-label, acciones a la derecha); 2 pruebas; 111 tests en total.

## 2026-10-12 · 002-rediseno-mapa · T002 hecha
- guardarUltimaVista/hrefUltimaVista en app/lib/vistaMapa.ts (clave urbanalert.vistaMapa, formato de URL, validada con leerVista, tolerante a fallos); 4 pruebas con almacenamiento en memoria (gotcha Node 25+ localStorage en CLAUDE.md). 115 tests.

## 2026-10-12 · 002-rediseno-mapa · T003 hecha
- PanelDano: aside con título «Detalle del daño», cerrar con botón/Esc, foco al abrir; tipo, categoría · Reportado por, imagen ancha, descripción, estado, nivel, fecha, ubicación, «Ver en el histórico»; estados cargando/404/error. 8 pruebas (123 en total). DetalleDano se borra en T004 para que cada commit compile.

## 2026-10-12 · 002-rediseno-mapa · T004 hecha
- MapaDanos sin Popup ni catálogo: seleccionado/onSeleccionar, punto activo azul radio 10 dibujado al final, AjustarTamano (ResizeObserver → invalidateSize + panTo del seleccionado). DetalleDano.* borrados (119 tests). app/mapa/page.tsx con cambio mínimo para compilar (T005 la rehace). iCloud: copias « 2» en .next → .next borrado, patrón ignorado en .gitignore, gotcha en CLAUDE.md.

## 2026-10-12 · 002-rediseno-mapa · T005 hecha
- VistaPrincipal (PantallaMapa): h-dvh, BarraSuperior con Crear reporte, mapa flex-1 + PanelDano (md+: columna 400 px; < md: hoja inferior 60 %, z 1100), usuarios una vez, foco al .leaflet-container al cerrar, replaceState + guardarUltimaVista. / y /mapa la reexportan; mapa/layout sin envoltorio. page.test (3). 120 tests; títulos UrbanAlert y Mapa de daños · UrbanAlert en out/.

## 2026-10-12 · 002-rediseno-mapa · T006 hecha
- Formulario con BarraSuperior: «← Volver al mapa» (useSyncExternalStore con hrefUltimaVista; snapshot de servidor «/», porque la regla react-hooks prohíbe setState en efectos) y el botón de usuario en la barra; ReporteCreadoModal con enlace «Volver al mapa». 5 pruebas nuevas (125).

## 2026-10-12 · 002-rediseno-mapa · T007 hecha
- Navegador (next dev + gateway real). 1440×900: barra 64 px, mapa 1440×836, sin scroll; clic en el reporte 01a12d63 → panel 400 px (x 1041–1440), mapa 1040 px, 25 teselas cargadas, punto azul centrado, foco en el panel; Esc → sin panel, mapa 1440, foco en el mapa. 1100×700: captura con panel (título, Reportado por test-user, imagen, campos, Ver en el histórico) → /historial/detalle con título correcto. 375×812: barra y mapa sin scroll, hoja inferior 449 px (60 %) con scroll propio; fallo: tapaba el punto → T010. Formulario: «← Volver al mapa» con la última vista y vuelve a ella. Gotcha: los clics del panel del navegador usan otro marco que la captura con viewports emulados mayores que el panel.

## 2026-10-12 · 002-rediseno-mapa · nota sobre el commit de T007
- El build de ese comando falló con «Failed to open database» (caché .next bloqueada por el next dev recién parado). Con .next limpio: build, lint y 128 tests en verde; el commit es válido.

## 2026-10-12 · 002-rediseno-mapa · T008 hecha
- Nota en specs/mapa-functional-spec.md (US-M04 y US-M06 sustituidas por 002) y README (pantalla principal, panel, volver al mapa, enlaces a specs 002 y 003).

## 2026-10-12 · 002/003 · push autorizado
- Usuario: «push it». Push de 002 (T001–T008, T010) y 003 (T001–T004).

## 2026-10-12 · 002-rediseno-mapa · T009 hecha
- Run 38319033373 en verde (0 cambios de infraestructura; smoke con título y sin plantilla). En https://dfa8690dowmry.cloudfront.net: título UrbanAlert, lang es, 3 iconos, barra con logo, sin iframe ni scroll; clic en el reporte 01a12d63 → panel derecho con imagen, Reportado por test-user y enlace /historial/detalle/?id=…; formulario «Crear reporte · UrbanAlert» con Volver al mapa a la última vista; /no-existe/ → «Página no encontrada · UrbanAlert». MS-001–MS-003 cumplidas.

## 2026-10-12 · 003-identidad-sitio · T005 hecha, implementada
- Publicada con el run 38319033373: títulos, lang es, iconos y 404 verificados en el sitio.

## 2026-10-12 · 002-rediseno-mapa · implementada
- Publicada y verificada en el sitio (ver T009). Specs 002 y 003 en Estado: implementada.

## 2026-10-13 · 002-rediseno-mapa · enmienda HU-5
- Usuario: centrar en Teusaquillo, paneo libre, botón «Reiniciar mapa». Spec (HU-5, RF-015–018), plan D-007 y tareas T011–T013; aprobada por la propia petición. Las consultas ya se recortan a Bogotá (celdasVisibles).

## 2026-10-12 · 002-rediseno-mapa · T011 hecha
- VISTA_INICIAL = CENTRO_TEUSAQUILLO (4.63868, -74.08289) con ZOOM_MIN; leerVista acepta lat [-90, 90] y lon [-180, 180]; pruebas ajustadas y nuevas (130). CENTRO_BOGOTA intacto para el selector del formulario.

## 2026-10-12 · 002-rediseno-mapa · T012 hecha
- MapaDanos sin maxBounds; BotonReiniciar como L.Control topleft bajo el zoom. 130 tests, lint y build OK.

## 2026-10-13 · 002-rediseno-mapa · HU-5 verificada en navegador (next dev + gateway)
- / abre en ?lat=4.63868&lon=-74.08289&zoom=12 (Teusaquillo al centro), 19 burbujas, 26 daños. Arrastrado hasta lon -79.4 (Pacífico) sin rebote: «No hay daños reportados en esta zona», 0 peticiones fallidas, sin avisos. «Reiniciar mapa» bajo el zoom → vuelve a Teusaquillo zoom 12; con el panel abierto, el panel sigue («Grietas en la vía»). Gotcha: con el panel del navegador oculto el viewport mide 0×0 y el mapa calcula mal su vista: usar tabs_select antes de verificar.

## 2026-10-13 · 002-rediseno-mapa · enmienda HU-6
- Usuario (mientras se verificaba HU-5): botón para volver al inicio en historial y en el detalle, y acceso a historial en la barra del mapa. HU-6, RF-019–020, D-008, T014–T015.

## 2026-10-12 · 002-rediseno-mapa · T014 hecha
- VolverAlMapa (useSyncExternalStore + hrefUltimaVista) usado por el formulario y por la barra del layout de /historial («← Volver al inicio», también en el detalle); «Histórico» en la barra principal. Pruebas: VolverAlMapa (2), layout del histórico (1), page.test (+1). 134 tests, lint y build OK.

## 2026-10-13 · 002-rediseno-mapa · HU-6 verificada en navegador
- Barra principal: «Histórico» → /historial («Histórico de reportes · UrbanAlert», barra con «← Volver al inicio» a la última vista). «Ver detalle» → detalle («Detalle del reporte · UrbanAlert») con la barra y el enlace «← Volver al histórico» existente. «Volver al inicio» → mapa en esa vista. 375 px: logo, Histórico y Crear reporte caben (sin scroll horizontal). El histórico ya tiene 5 reportes (creados por el equipo).
