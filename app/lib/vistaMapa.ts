
export type VistaMapa = { lat: number; lon: number; zoom: number };

export const ZOOM_MIN = 12;
export const ZOOM_MAX = 18;
// Desde este zoom se ven las calles: cada daño es un punto. Antes, solo burbujas.
export const ZOOM_PUNTOS = 15;

// Vista inicial y de «Reiniciar mapa»: centrada en Teusaquillo (punto de su etiqueta en public/localidades.geojson)
// con el zoom de ciudad (spec 002-rediseno-mapa, RF-015).
export const CENTRO_TEUSAQUILLO = { lat: 4.63868, lon: -74.08289 };
export const VISTA_INICIAL: VistaMapa = { ...CENTRO_TEUSAQUILLO, zoom: ZOOM_MIN };

function numero(valor: string | null): number | null {
  if (valor === null || valor.trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

// ?lat&lon&zoom de la URL. Un centro inválido da la vista inicial; uno fuera de Bogotá se respeta, porque el mapa
// se puede mover libremente (RF-018). El zoom se limita al rango del mapa.
export function leerVista(parametros: URLSearchParams): VistaMapa {
  const lat = numero(parametros.get("lat"));
  const lon = numero(parametros.get("lon"));
  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return VISTA_INICIAL;
  const zoom = numero(parametros.get("zoom")) ?? ZOOM_MIN;
  return { lat, lon, zoom: Math.min(Math.max(Math.round(zoom), ZOOM_MIN), ZOOM_MAX) };
}

export function escribirVista({ lat, lon, zoom }: VistaMapa): string {
  return new URLSearchParams({ lat: lat.toFixed(5), lon: lon.toFixed(5), zoom: String(zoom) }).toString();
}

// Última vista del mapa en este navegador, para «Volver al mapa» (spec 002-rediseno-mapa, RF-012).
// Se guarda con el mismo formato que la URL; sin almacenamiento (modo privado, bloqueado) no pasa nada.
const CLAVE_ULTIMA_VISTA = "urbanalert.vistaMapa";

export function guardarUltimaVista(vista: VistaMapa) {
  try {
    localStorage.setItem(CLAVE_ULTIMA_VISTA, escribirVista(vista));
  } catch {
    // Sin almacenamiento: «Volver al mapa» abrirá la vista por defecto.
  }
}

// "/?lat&lon&zoom" con la última vista guardada, o "/" si no hay una válida.
export function hrefUltimaVista(): string {
  let guardada: string | null = null;
  try {
    guardada = localStorage.getItem(CLAVE_ULTIMA_VISTA);
  } catch {
    return "/";
  }
  if (!guardada) return "/";
  const vista = leerVista(new URLSearchParams(guardada));
  return vista === VISTA_INICIAL ? "/" : `/?${escribirVista(vista)}`;
}

// Cuánto desplazar el mapa (en píxeles) para que el punto seleccionado quede a la vista con el panel abierto
// (spec 002-rediseno-mapa, casos borde). En pantallas anchas el panel estrecha el mapa: basta con que el punto
// esté dentro. En estrechas la hoja inferior tapa el 60 % inferior del mapa: el punto debe quedar en el 40 %
// superior; si no, se lleva al 20 % de la altura. null si no hace falta moverlo.
export function desplazamientoParaVer(
  punto: { x: number; y: number },
  tamano: { x: number; y: number },
  estrecha: boolean
): { x: number; y: number } | null {
  const altoVisible = estrecha ? tamano.y * 0.4 : tamano.y;
  const dentro = punto.x >= 0 && punto.x <= tamano.x && punto.y >= 0 && punto.y <= altoVisible;
  if (dentro) return null;
  const destino = { x: tamano.x / 2, y: estrecha ? tamano.y * 0.2 : tamano.y / 2 };
  return { x: punto.x - destino.x, y: punto.y - destino.y };
}
