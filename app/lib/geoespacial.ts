import { obtenerJson } from "./api";

// Forma de GET /api/v1/geoespacial/coordinates/{id} (servicio Geoespacial).
export type Coordenada = {
  coordinateId: string;
  reportId: string;
  coordinate: { lat: number; lon: number };
};

export function obtenerCoordenada(idCoordenada: string, signal?: AbortSignal): Promise<Coordenada> {
  return obtenerJson<Coordenada>(
    `/api/v1/geoespacial/coordinates/${encodeURIComponent(idCoordenada)}`,
    signal
  );
}

// Elemento de GET /api/v1/geoespacial/reports: reportes a `radius` metros o menos del punto,
// del más cercano al más lejano. Geoespacial no conoce el estado del reporte.
export type DanoCercano = Coordenada;

export function listarCercanos(
  centro: { lat: number; lon: number },
  radioMetros: number,
  signal?: AbortSignal
): Promise<DanoCercano[]> {
  const query = new URLSearchParams({
    lat: String(centro.lat),
    lon: String(centro.lon),
    radius: String(radioMetros),
  });
  return obtenerJson<DanoCercano[]>(`/api/v1/geoespacial/reports?${query}`, signal);
}
