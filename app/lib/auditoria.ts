import { obtenerJson } from "./api";

// Forma de GET /api/v1/auditoria/reportes/{id} (servicio de Auditoría).
export type EventoAuditoria = {
  sequence: number;
  eventId: string;
  eventType: string;
  version: number;
  occurredAt: string;
  actorId: string;
  correlationId: string | null;
  data: Record<string, unknown>;
  previousHash: string;
  hash: string;
};

export type LineaDeTiempo = {
  reportId: string;
  items: EventoAuditoria[];
  nextCursor: string | null;
};

export type Integridad = {
  reportId: string;
  verified: boolean;
  reportEventCount: number;
  chainEventCount: number;
  headMatches: boolean;
  brokenSequence: number | null;
  checkedAt: string;
};

export const LIMITE_EVENTOS = 50;

export function obtenerLineaDeTiempo(
  idReporte: string,
  cursor?: string | null,
  signal?: AbortSignal
): Promise<LineaDeTiempo> {
  const query = new URLSearchParams({ limit: String(LIMITE_EVENTOS) });
  if (cursor) query.set("cursor", cursor);
  return obtenerJson<LineaDeTiempo>(
    `/api/v1/auditoria/reportes/${encodeURIComponent(idReporte)}?${query}`,
    signal
  );
}

export function verificarIntegridad(idReporte: string, signal?: AbortSignal): Promise<Integridad> {
  return obtenerJson<Integridad>(
    `/api/v1/auditoria/reportes/${encodeURIComponent(idReporte)}/integridad`,
    signal
  );
}
