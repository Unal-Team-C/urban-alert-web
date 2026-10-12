# Plan técnico: Rediseño del mapa como vista principal

- **Spec**: ./spec.md
- **Estado**: aprobado <!-- borrador | aprobado -->
- **Fecha**: 2026-10-12

## 1. Resumen técnico

Se extrae la vista del mapa de `app/mapa/page.tsx` a un componente `VistaPrincipal` que usan `/` y `/mapa`, sin iframe. La página es una columna a pantalla completa (`h-dvh`): `BarraSuperior` (logo a la izquierda, acciones a la derecha) y debajo una fila con el mapa (flexible) y, si hay un daño seleccionado, `PanelDano` (400 px a la derecha; hoja inferior en pantallas estrechas). `MapaDanos` deja de abrir un `Popup`: informa el punto pulsado y resalta el seleccionado, y ajusta Leaflet cuando cambia el tamaño de su contenedor. El formulario usa la misma barra con «Volver al mapa», que abre `/` en la última vista guardada en `localStorage`.

## 2. Contexto técnico

| Aspecto | Valor |
|---|---|
| Lenguaje / versión | TypeScript, Next.js 16 (exportación estática), React 19, Tailwind 4, react-leaflet 5 |
| Dependencias | Ninguna nueva |
| Almacenamiento | `localStorage` (`urbanalert.vistaMapa`) solo para la última vista; tolera que falle |
| Pruebas | Vitest + Testing Library; verificación en navegador (escritorio 1440 × 900 y móvil 375 × 812) con `next dev` contra el gateway real |
| Restricciones | Constitución: todo en el navegador; Leaflet solo en cliente (`next/dynamic`, `ssr: false`) |

## 3. Verificación contra la constitución

| Principio | ¿Cumple? | Nota |
|---|---|---|
| P1–P5, P7–P10 | Sí | Sin cambios de infraestructura, coste ni contrato con la plataforma |
| P6 | Sí | lint, test y build antes de cada commit |

## 4. Arquitectura y componentes

```text
/ y /mapa ── <Suspense> ── PantallaMapa
              ├─ BarraSuperior (logo → "/", derecha: «Crear reporte»)
              └─ fila flex-1 (relative, min-h-0)
                   ├─ MapaDanos (flex-1)           seleccionado, onSeleccionar(punto | null)
                   └─ PanelDano (si hay selección) reportId, coordenada, catalogo, usuarios, onCerrar
                        md+: columna de 400 px a la derecha · < md: absoluto abajo, máx. 60 % del alto
```

- **`BarraSuperior`** (`app/components/BarraSuperior.tsx`): `<header>` de 64 px, logo (`/logo-urbanalert.png`, alto 48 px, ancho automático, `alt="UrbanAlert"`) enlazado a `/`, `children` alineados a la derecha.
- **`VistaPrincipal`** (`app/components/VistaPrincipal.tsx`): lo que hoy hace `app/mapa/page.tsx` (vista inicial desde la URL, catálogo, localidades, `replaceState`) más: guarda la última vista, carga los usuarios una vez y mantiene el punto seleccionado.
- **`MapaDanos`**: nuevas props `seleccionado: string | null` y `onSeleccionar`. `CapaPuntos` sin `Popup`: clic → `onSeleccionar(punto)`; el seleccionado se dibuja mayor (radio 10) y en azul. `AjustarTamano` (hijo del mapa): `ResizeObserver` sobre el contenedor → `map.invalidateSize()`; al cambiar la selección, si el punto quedó fuera de la vista, `panTo`.
- **`PanelDano`** (`app/mapa/components/PanelDano.tsx`, sustituye a `DetalleDano`): `<aside>` con título, botón de cerrar, contenido con desplazamiento propio. Cierra con Esc (escucha `keydown` mientras está montado). Recibe el foco al abrirse; al cerrarse, `VistaPrincipal` devuelve el foco al contenedor del mapa.
- **Formulario**: la barra sustituye al botón de usuario absoluto; a la derecha «Volver al mapa» y el botón de usuario. `ReporteCreadoModal` añade el enlace «Volver al mapa».

## 5. Estructura de archivos

```text
public/logo-urbanalert.png                    # copia de fuentes/logo-urbanalert.png
app/components/BarraSuperior.tsx (+ .test)
app/components/VistaPrincipal.tsx
app/page.tsx (+ .test)                        # barra + VistaPrincipal (sin iframe)
app/mapa/page.tsx                             # misma pantalla que /
app/mapa/layout.tsx                           # sin el envoltorio h-screen (lo da la pantalla)
app/mapa/components/MapaDanos.tsx             # selección, resaltado, sin Popup, invalidateSize
app/mapa/components/PanelDano.tsx (+ .test)   # sustituye DetalleDano.tsx (+ .test, se borran)
app/lib/vistaMapa.ts (+ .test)                # guardarUltimaVista / hrefUltimaVista
app/reportes/nuevo/page.tsx (+ .test nuevo)   # barra con Volver al mapa
app/components/ReporteCreadoModal.tsx (+ .test nuevo)
specs/mapa-functional-spec.md                 # nota: US-M04 y US-M06 sustituidas por la spec 002
```

## 6. Modelo de datos

Última vista: `localStorage["urbanalert.vistaMapa"] = "lat=4.71100&lon=-74.07210&zoom=12"` (mismo formato que la URL, validado con `leerVista` al leer).

## 7. Contratos / interfaces

- `MapaDanos`: `+ seleccionado: string | null`, `+ onSeleccionar: (punto: DanoCercano | null) => void`.
- `PanelDano`: `{ reportId, coordenada, catalogo, usuarios, onCerrar }`; región `aria-labelledby` con el título; botón «Cerrar detalle».
- `vistaMapa.ts`: `guardarUltimaVista(vista)`, `hrefUltimaVista(): string` (`/?lat&lon&zoom` o `/`).
- APIs: las mismas de hoy (`GET /api/v1/reportes/{id}`, `/catalogo`, `/usuarios`, Geoespacial `reports`); sin cambios.

## 8. Decisiones

### D-001: Una sola pantalla para `/` y `/mapa`
- **Decisión**: `/` y `/mapa` renderizan la misma pantalla (barra + mapa); se quita el iframe.
- **Alternativas**: redirigir `/mapa` a `/` (la exportación estática no tiene redirecciones de servidor; habría que hacerlo en el cliente, con parpadeo).
- **Motivo**: RF-004 sin parpadeo; código compartido.

### D-002: Panel en flujo en escritorio, superpuesto en móvil
- **Decisión**: en `md+` el panel es una columna fija de 400 px y el mapa se estrecha (no tapa puntos); en `< md`, hoja inferior superpuesta (máx. 60 %).
- **Motivo**: HU-2.2 y HU-2.8; Leaflet necesita `invalidateSize` al cambiar de ancho (D-003).

### D-003: `ResizeObserver` + `invalidateSize`
- **Decisión**: un componente dentro del mapa observa su contenedor; cubre abrir/cerrar el panel y redimensionar la ventana (HU-1.3).
- **Alternativas**: llamar a `invalidateSize` al abrir/cerrar (no cubre el redimensionado de ventana).

### D-004: El detalle deja el `Popup`
- **Decisión**: `PanelDano` sustituye a `DetalleDano` reutilizando su lógica (carga al pulsar, 404, error con reintento, imagen que se oculta si falla) y añade «Reportado por» y «Ver en el histórico».
- **Motivo**: HU-2; RNF-002 (usuarios una vez por pantalla, como el histórico).

### D-005: Logo completo en la barra
- **Decisión**: el PNG proporcionado tal cual, a 48 px de alto en una barra de 64 px (≈ 63 px de ancho).
- **Alternativas**: recomponer «pin + texto» en horizontal (modificaría la marca).

### D-006: Última vista en `localStorage`
- **Decisión**: `VistaPrincipal` guarda la vista en cada movimiento; «Volver al mapa» construye `/?lat&lon&zoom` al montar el formulario. Sin almacenamiento → `/`.
- **Motivo**: RF-012; la URL ya sabe abrir una vista.

### D-007: Teusaquillo, paneo libre y «Reiniciar mapa» (enmienda 2026-10-13)
- **Decisión**: `VISTA_INICIAL` = etiqueta de Teusaquillo (4.63868, -74.08289) con `ZOOM_MIN`; `CENTRO_BOGOTA` no cambia (lo usa el selector del formulario). `MapaDanos` sin `maxBounds`/`maxBoundsViscosity`; `celdasVisibles` ya recorta las consultas a Bogotá. `leerVista` acepta cualquier latitud [-90, 90] y longitud [-180, 180]. Botón como control nativo de Leaflet (`L.Control`, esquina superior izquierda, bajo el zoom) que hace `setView(VISTA_INICIAL)`.
- **Alternativas**: botón en la barra superior (lejos de los controles del mapa); superponer un botón con posición fija (se descuadra con los controles de Leaflet).
- **Riesgo**: fuera de Bogotá el aviso dice «No hay daños reportados en esta zona», que es cierto.

## 9. Estrategia de pruebas

- **Vitest**: `BarraSuperior` (logo enlaza a `/`, alt, hijos a la derecha); `PanelDano` (cargando, 404, error y reintento, campos con nombre del usuario y fallback, enlace al histórico, imagen, botón y Esc llaman a `onCerrar`, foco al abrir); `vistaMapa` (guardar/leer, valor inválido o sin almacenamiento → `/`); `/` (barra con «Crear reporte», sin iframe); formulario («Volver al mapa» con la última vista); `ReporteCreadoModal` (enlace «Volver al mapa»). Las pruebas de `useDanosVisibles`, histórico y demás siguen.
- **Navegador** (Leaflet no es fiable en jsdom): `next dev` con `NEXT_PUBLIC_API_URL` del gateway; en 1440 × 900 y 375 × 812: barra y mapa sin desplazamiento, clic en un punto → panel con el reporte de prueba, resaltado, otro punto, Esc, cerrar, «Ver en el histórico», volver al mapa desde el formulario.
- **Build y lint** en cada commit.

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Leaflet con teselas grises tras cambiar el ancho | Mapa roto al abrir el panel | D-003, verificado en navegador |
| `preferCanvas`: el punto seleccionado queda debajo de otros | Resaltado invisible | Dibujar el seleccionado al final de la capa |
| Clic en el mapa vacío | ¿Cerrar el panel? | No cierra (solo cerrar/Esc/otro punto), para poder mover el mapa con el panel abierto |
| Logo pequeño en móvil | Poco legible | 48 px de alto también en móvil; la barra no muestra texto extra |

## 11. Trazabilidad

| Requisito | Componentes | Pruebas |
|---|---|---|
| RF-001 | BarraSuperior, app/page.tsx | BarraSuperior.test, page.test |
| RF-002 | VistaPrincipal, AjustarTamano | navegador |
| RF-003 | VistaPrincipal, MapaDanos | useDanosVisibles.test, navegador |
| RF-004 | app/mapa/page.tsx | navegador |
| RF-005, RF-008, RF-009 | PanelDano | PanelDano.test |
| RF-006 | MapaDanos | navegador |
| RF-007 | PanelDano, VistaPrincipal | PanelDano.test, navegador |
| RF-010 | VistaPrincipal (clases responsive) | navegador (375 × 812) |
| RF-011, RF-012 | formulario, vistaMapa | nuevo/page.test, vistaMapa.test |
| RF-013 | ReporteCreadoModal | ReporteCreadoModal.test |
| RNF-001 | PanelDano | PanelDano.test |
| RNF-002 | VistaPrincipal | PanelDano.test (una petición) |
