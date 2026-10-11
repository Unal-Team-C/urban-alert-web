import { LIMITES_BOGOTA, type Coordenada } from "./ubicacion";

// Geoespacial responde círculos de hasta 6 km, pero una vista alejada de Bogotá mide ~50 km.
// El área visible se divide en celdas cuadradas de una cuadrícula fija (anclada al rango de
// Bogotá, no a la vista) y cada celda se pide como el círculo que la contiene. El tamaño de
// la celda depende del zoom, así el radio pedido sigue al zoom y las celdas se pueden cachear.

export type Limites = { latMin: number; latMax: number; lonMin: number; lonMax: number };

export type Celda = {
  clave: string;
  lado: number;
  i: number;
  j: number;
  limites: Limites;
  centro: Coordenada;
  radio: number;
};

export const RADIO_MAXIMO = 6000;
export const LADO_BASE = 8000;
const ZOOM_LADO_BASE = 14;
const METROS_POR_GRADO = 111_320;
const LAT_REFERENCIA = (LIMITES_BOGOTA.latMin + LIMITES_BOGOTA.latMax) / 2;
// Geoespacial mide sobre el elipsoide y aquí sobre una esfera (diferencia < 0,5 %): el margen
// evita perder un punto en la esquina de la celda.
const MARGEN_RADIO = 1.01;
const RADIO_TIERRA = 6_371_008.8;

export function ladoParaZoom(zoom: number): number {
  const z = Math.floor(zoom);
  return z <= ZOOM_LADO_BASE ? LADO_BASE : LADO_BASE / 2 ** (z - ZOOM_LADO_BASE);
}

// Tamaño de la celda en grados. Al dividir el lado entre una potencia de 2 los pasos se
// dividen exactamente, así los bordes de una celda coinciden con los de su ancestro.
function pasos(lado: number) {
  return {
    dLat: lado / METROS_POR_GRADO,
    dLon: lado / (METROS_POR_GRADO * Math.cos((LAT_REFERENCIA * Math.PI) / 180)),
  };
}

function distancia(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA * Math.asin(Math.sqrt(h));
}

export function celda(lado: number, i: number, j: number): Celda {
  const { dLat, dLon } = pasos(lado);
  const b = LIMITES_BOGOTA;
  const limites = {
    latMin: Math.max(b.latMin + i * dLat, b.latMin),
    latMax: Math.min(b.latMin + (i + 1) * dLat, b.latMax),
    lonMin: Math.max(b.lonMin + j * dLon, b.lonMin),
    lonMax: Math.min(b.lonMin + (j + 1) * dLon, b.lonMax),
  };
  const centro = {
    lat: (limites.latMin + limites.latMax) / 2,
    lon: (limites.lonMin + limites.lonMax) / 2,
  };
  const esquinas = [
    { lat: limites.latMin, lon: limites.lonMin },
    { lat: limites.latMin, lon: limites.lonMax },
    { lat: limites.latMax, lon: limites.lonMin },
    { lat: limites.latMax, lon: limites.lonMax },
  ];
  const radio = Math.ceil(Math.max(...esquinas.map((e) => distancia(centro, e))) * MARGEN_RADIO);
  return { clave: `${lado}:${i}:${j}`, lado, i, j, limites, centro, radio };
}

// Celdas del nivel del zoom que tocan la vista, recortada a Bogotá.
export function celdasVisibles(vista: Limites, zoom: number): Celda[] {
  const b = LIMITES_BOGOTA;
  const latMin = Math.max(vista.latMin, b.latMin);
  const latMax = Math.min(vista.latMax, b.latMax);
  const lonMin = Math.max(vista.lonMin, b.lonMin);
  const lonMax = Math.min(vista.lonMax, b.lonMax);
  if (latMin > latMax || lonMin > lonMax) return [];

  const lado = ladoParaZoom(zoom);
  const { dLat, dLon } = pasos(lado);
  const ultimaFila = Math.ceil((b.latMax - b.latMin) / dLat) - 1;
  const ultimaColumna = Math.ceil((b.lonMax - b.lonMin) / dLon) - 1;
  const fila = (lat: number) => Math.min(Math.floor((lat - b.latMin) / dLat), ultimaFila);
  const columna = (lon: number) => Math.min(Math.floor((lon - b.lonMin) / dLon), ultimaColumna);

  const celdas: Celda[] = [];
  for (let i = fila(latMin); i <= fila(latMax); i++) {
    for (let j = columna(lonMin); j <= columna(lonMax); j++) {
      celdas.push(celda(lado, i, j));
    }
  }
  return celdas;
}

// Semiabierta [min, max), salvo en el borde exterior de Bogotá: así cada punto cae en una
// sola celda aunque los círculos pedidos se solapen.
export function enCelda({ limites }: Celda, { lat, lon }: Coordenada): boolean {
  const b = LIMITES_BOGOTA;
  const dentroLat = lat >= limites.latMin && (lat < limites.latMax || (limites.latMax === b.latMax && lat <= b.latMax));
  const dentroLon = lon >= limites.lonMin && (lon < limites.lonMax || (limites.lonMax === b.lonMax && lon <= b.lonMax));
  return dentroLat && dentroLon;
}

// Celdas mayores que contienen a esta, de la más cercana a la de LADO_BASE.
export function ancestros(c: Celda): Celda[] {
  const lista: Celda[] = [];
  let { lado, i, j } = c;
  while (lado < LADO_BASE) {
    lado *= 2;
    i = Math.floor(i / 2);
    j = Math.floor(j / 2);
    lista.push(celda(lado, i, j));
  }
  return lista;
}
