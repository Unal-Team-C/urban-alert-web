"use client";

import { useState } from "react";
import { formatearFecha } from "../../lib/formato";
import {
  obtenerLineaDeTiempo,
  type EventoAuditoria,
  type LineaDeTiempo as Linea,
} from "../../lib/auditoria";
import { nombreDeUsuario, type Usuario } from "../../lib/usuarios";
import { useCarga } from "../../lib/useCarga";
import { Cargando, ErrorReintentar, Vacio } from "./Estados";

// Textos de eventos conocidos (códigos tal como los emite Auditoría); cualquier otro tipo
// se muestra tal como llega, así los eventos nuevos del backend aparecen sin cambios aquí.
const ETIQUETAS: Record<string, string> = {
  "reporte.creado": "Reporte creado",
};

function etiquetaEvento(tipo: string): string {
  return ETIQUETAS[tipo] ?? tipo;
}

function mensajeError(status: number, mensaje: string): string {
  if (status === 403) return "No tiene acceso al historial de auditoría de este reporte.";
  if (status === 404) return "Este reporte aún no tiene historial de auditoría.";
  return mensaje;
}

export default function LineaDeTiempo({
  idReporte,
  usuarios,
}: {
  idReporte: string;
  usuarios: Usuario[];
}) {
  const primera = useCarga((signal) => obtenerLineaDeTiempo(idReporte, null, signal), idReporte);
  const [extra, setExtra] = useState<{ items: EventoAuditoria[]; nextCursor: string | null } | null>(
    null
  );
  const [cargandoMas, setCargandoMas] = useState(false);
  const [errorMas, setErrorMas] = useState("");

  const base: Linea | undefined = primera.datos;
  const eventos = [...(base?.items ?? []), ...(extra?.items ?? [])];
  const siguiente = extra ? extra.nextCursor : (base?.nextCursor ?? null);

  async function cargarMas() {
    if (!siguiente) return;
    setCargandoMas(true);
    setErrorMas("");
    try {
      const mas = await obtenerLineaDeTiempo(idReporte, siguiente);
      setExtra((previo) => ({
        items: [...(previo?.items ?? []), ...mas.items],
        nextCursor: mas.nextCursor,
      }));
    } catch (e) {
      setErrorMas((e as Error).message);
    } finally {
      setCargandoMas(false);
    }
  }

  return (
    <section aria-labelledby="titulo-linea" className="rounded-xl bg-white p-6 shadow">
      <h2 id="titulo-linea" className="mb-4 text-xl font-semibold text-gray-900">
        Línea de tiempo
      </h2>

      {primera.cargando ? (
        <Cargando texto="Cargando historial..." />
      ) : primera.error ? (
        <ErrorReintentar
          mensaje={mensajeError(primera.error.status, primera.error.message)}
          onReintentar={primera.reintentar}
        />
      ) : eventos.length === 0 ? (
        <Vacio texto="Sin eventos registrados." />
      ) : (
        <>
          <ol className="space-y-4 border-l-2 border-gray-200 pl-4">
            {eventos.map((evento) => (
              <li key={evento.eventId}>
                <p className="font-medium text-gray-900">{etiquetaEvento(evento.eventType)}</p>
                <p className="text-sm text-gray-500">
                  {formatearFecha(evento.occurredAt)} · {nombreDeUsuario(usuarios, evento.actorId)}
                </p>
              </li>
            ))}
          </ol>
          {errorMas && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {errorMas}
            </p>
          )}
          {siguiente && (
            <button
              type="button"
              onClick={cargarMas}
              disabled={cargandoMas}
              className="mt-4 rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              {cargandoMas ? "Cargando..." : "Cargar más"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
