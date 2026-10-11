import { obtenerJson } from "./api";
import type { CategoriaCatalogo } from "./catalogo";

export type Pagina<T> = {
  elementos: T[];
  pagina: number;
  tamanoPagina: number;
  totalElementos: number;
};

// Forma de GET /api/v1/reportes (servicio de Reportes).
export type Reporte = {
  id: string;
  categoria: string;
  tipo: string;
  descripcion: string;
  idCoordenada: string;
  urlImagen: string | null;
  nombreImagen: string | null;
  idUsuario: string;
  nivelEmergencia: string;
  estado: string;
  fecha: string;
  idResponsable: string | null;
  motivoRechazo: string | null;
};

export type FiltrosReportes = { estado?: string; nivelEmergencia?: string; tipo?: string };

export const TAMANO_PAGINA = 20;

function consulta(parametros: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== "") query.set(clave, String(valor));
  }
  return query.toString();
}

export function listarReportes(
  filtros: FiltrosReportes,
  pagina: number,
  signal?: AbortSignal
): Promise<Pagina<Reporte>> {
  const query = consulta({ ...filtros, pagina, tamanoPagina: TAMANO_PAGINA });
  return obtenerJson<Pagina<Reporte>>(`/api/v1/reportes?${query}`, signal);
}

export function obtenerReporte(id: string, signal?: AbortSignal): Promise<Reporte> {
  return obtenerJson<Reporte>(`/api/v1/reportes/${encodeURIComponent(id)}`, signal);
}

export function obtenerCatalogo(signal?: AbortSignal): Promise<CategoriaCatalogo[]> {
  return obtenerJson<CategoriaCatalogo[]>("/api/v1/reportes/catalogo", signal);
}

// Total de reportes con un valor de filtro: se pide una página de 1 elemento y se lee
// totalElementos, así el conteo es exacto sin traer los reportes.
export async function contarPor(
  filtro: keyof FiltrosReportes,
  valor: string,
  signal?: AbortSignal
): Promise<number> {
  const query = consulta({ [filtro]: valor, pagina: 1, tamanoPagina: 1 });
  const pagina = await obtenerJson<Pagina<Reporte>>(`/api/v1/reportes?${query}`, signal);
  return pagina.totalElementos;
}
