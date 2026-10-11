import { obtenerJson } from "./api";
import type { Limites } from "./celdas";
import type { Coordenada } from "./ubicacion";

// Localidades de Bogotá: public/localidades.geojson, generado con scripts/localidades_geojson.py
// a partir del shapefile de la Secretaría Distrital de Planeación (Datos Abiertos Bogotá, CC BY 4.0).

type Anillo = [number, number][]; // [lon, lat], como en GeoJSON

type EntidadGeoJson = {
  properties: { codigo: string; nombre: string; etiqueta: [number, number]; limites: Limites };
  geometry: { type: "MultiPolygon"; coordinates: Anillo[][] };
};

export type Localidad = {
  codigo: string;
  nombre: string;
  // Punto interior donde va la burbuja.
  etiqueta: Coordenada;
  limites: Limites;
  // Todos los anillos (externos y huecos); el punto en polígono usa la regla par-impar.
  anillos: Anillo[];
  // Para dibujar con Leaflet: polígonos → anillos → [lat, lon].
  poligonos: [number, number][][][];
};

export const ATRIBUCION_LOCALIDADES =
  'Localidades: <a href="https://datosabiertos.bogota.gov.co/dataset/856cb657-8ca3-4ee8-857f-37211173b1f8">SDP, Datos Abiertos Bogotá</a> (CC BY 4.0)';

export function desdeGeoJson(entidades: EntidadGeoJson[]): Localidad[] {
  return entidades.map(({ properties: p, geometry }) => ({
    codigo: p.codigo,
    nombre: p.nombre,
    etiqueta: { lat: p.etiqueta[0], lon: p.etiqueta[1] },
    limites: p.limites,
    anillos: geometry.coordinates.flat(),
    poligonos: geometry.coordinates.map((poligono) =>
      poligono.map((anillo) => anillo.map(([lon, lat]) => [lat, lon] as [number, number]))
    ),
  }));
}

export async function cargarLocalidades(signal?: AbortSignal): Promise<Localidad[]> {
  const coleccion = await obtenerJson<{ features: EntidadGeoJson[] }>("/localidades.geojson", signal);
  return desdeGeoJson(coleccion.features);
}

export function seIntersecan(a: Limites, b: Limites): boolean {
  return a.latMin <= b.latMax && b.latMin <= a.latMax && a.lonMin <= b.lonMax && b.lonMin <= a.lonMax;
}

export function dentroDeLocalidad(localidad: Localidad, { lat, lon }: Coordenada): boolean {
  const l = localidad.limites;
  if (lat < l.latMin || lat > l.latMax || lon < l.lonMin || lon > l.lonMax) return false;
  let adentro = false;
  for (const anillo of localidad.anillos) {
    for (let k = 0, m = anillo.length - 1; k < anillo.length; m = k++) {
      const [x1, y1] = anillo[m];
      const [x2, y2] = anillo[k];
      if (y1 > lat !== y2 > lat && lon < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) adentro = !adentro;
    }
  }
  return adentro;
}

// La localidad de cada coordenada se calcula una vez: los puntos de la caché son los mismos
// objetos entre renders. La caché es por lista de localidades: con otra lista (p. ej. solo las
// visibles) un punto podría no tener localidad, y ese resultado no sirve para la lista completa.
const asignaciones = new WeakMap<Localidad[], WeakMap<Coordenada, string | null>>();

export function codigoLocalidad(localidades: Localidad[], punto: Coordenada): string | null {
  let porPunto = asignaciones.get(localidades);
  if (!porPunto) {
    porPunto = new WeakMap();
    asignaciones.set(localidades, porPunto);
  }
  let codigo = porPunto.get(punto);
  if (codigo === undefined) {
    codigo = localidades.find((l) => dentroDeLocalidad(l, punto))?.codigo ?? null;
    porPunto.set(punto, codigo);
  }
  return codigo;
}

// Daños por localidad; `localidades` debe ser la lista completa. Los puntos fuera de toda
// localidad (dentro del recuadro de Bogotá que valida Geoespacial, pero en otro municipio) no
// cuentan.
export function contarPorLocalidad(localidades: Localidad[], puntos: Coordenada[]): Map<string, number> {
  const totales = new Map<string, number>();
  for (const punto of puntos) {
    const codigo = codigoLocalidad(localidades, punto);
    if (codigo !== null) totales.set(codigo, (totales.get(codigo) ?? 0) + 1);
  }
  return totales;
}
