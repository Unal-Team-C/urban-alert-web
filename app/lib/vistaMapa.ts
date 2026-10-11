import { CENTRO_BOGOTA, dentroDeBogota } from "./ubicacion";

export type VistaMapa = { lat: number; lon: number; zoom: number };

export const ZOOM_MIN = 12;
export const ZOOM_MAX = 18;
// Desde este zoom se ven las calles: cada daño es un punto. Antes, solo burbujas.
export const ZOOM_PUNTOS = 15;

export const VISTA_INICIAL: VistaMapa = { ...CENTRO_BOGOTA, zoom: ZOOM_MIN };

function numero(valor: string | null): number | null {
  if (valor === null || valor.trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

// ?lat&lon&zoom de la URL. Un centro inválido o fuera de Bogotá da la vista inicial; el zoom
// se limita al rango del mapa.
export function leerVista(parametros: URLSearchParams): VistaMapa {
  const lat = numero(parametros.get("lat"));
  const lon = numero(parametros.get("lon"));
  if (lat === null || lon === null || !dentroDeBogota({ lat, lon })) return VISTA_INICIAL;
  const zoom = numero(parametros.get("zoom")) ?? ZOOM_MIN;
  return { lat, lon, zoom: Math.min(Math.max(Math.round(zoom), ZOOM_MIN), ZOOM_MAX) };
}

export function escribirVista({ lat, lon, zoom }: VistaMapa): string {
  return new URLSearchParams({ lat: lat.toFixed(5), lon: lon.toFixed(5), zoom: String(zoom) }).toString();
}
