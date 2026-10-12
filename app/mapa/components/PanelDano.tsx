"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import {
  nombreCategoria,
  nombreEstado,
  nombreNivel,
  nombreTipo,
  type CategoriaCatalogo,
} from "../../lib/catalogo";
import { formatearFecha } from "../../lib/formato";
import { obtenerReporte } from "../../lib/reportes";
import { formatearCoordenada, type Coordenada } from "../../lib/ubicacion";
import { useCarga } from "../../lib/useCarga";
import { nombreDeUsuario, type Usuario } from "../../lib/usuarios";

type Props = {
  reportId: string;
  coordenada: Coordenada;
  catalogo: CategoriaCatalogo[];
  usuarios: Usuario[];
  onCerrar: () => void;
};

function Campo({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{nombre}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  );
}

// Detalle del daño pulsado en el mapa, junto al mapa (spec 002-rediseno-mapa, HU-2). El reporte se pide al
// abrir el panel, no antes. Se cierra con el botón o con Esc; recibe el foco al abrirse o cambiar de daño.
export default function PanelDano({ reportId, coordenada, catalogo, usuarios, onCerrar }: Props) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    panel.current?.focus();
  }, [reportId]);

  useEffect(() => {
    function alPulsar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [onCerrar]);

  return (
    <aside
      ref={panel}
      tabIndex={-1}
      aria-labelledby="panel-dano-titulo"
      className="flex h-full flex-col bg-white text-gray-900 outline-none"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
        <h2 id="panel-dano-titulo" className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Detalle del daño
        </h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* key: al cambiar de daño se descarta el estado del anterior. */}
        <Contenido key={reportId} reportId={reportId} coordenada={coordenada} catalogo={catalogo} usuarios={usuarios} />
      </div>
    </aside>
  );
}

function Contenido({ reportId, coordenada, catalogo, usuarios }: Omit<Props, "onCerrar">) {
  const { datos: reporte, error, cargando, reintentar } = useCarga(
    (signal) => obtenerReporte(reportId, signal),
    reportId
  );

  if (cargando) {
    return (
      <div role="status" className="text-sm text-gray-500">
        Cargando daño...
      </div>
    );
  }

  if (error?.status === 404) {
    return <div className="text-sm text-gray-700">No hay un reporte registrado para este punto.</div>;
  }

  if (error || !reporte) {
    return (
      <div role="alert" className="text-sm text-red-800">
        <div>{error?.message ?? "Error inesperado."}</div>
        <button
          type="button"
          onClick={reintentar}
          className="mt-2 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{nombreTipo(catalogo, reporte.tipo)}</h3>
        <p className="text-sm text-gray-500">
          {nombreCategoria(catalogo, reporte.categoria)} · Reportado por{" "}
          <span className="font-medium text-gray-700">{nombreDeUsuario(usuarios, reporte.idUsuario)}</span>
        </p>
      </div>

      {reporte.urlImagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reporte.urlImagen}
          alt="Imagen del reporte"
          onError={(evento) => {
            evento.currentTarget.style.display = "none"; // URL rota: no mostrar el ícono de imagen rota
          }}
          className="max-h-80 w-full rounded-lg object-cover"
        />
      )}

      <p className="whitespace-pre-line text-sm text-gray-900">{reporte.descripcion}</p>

      <dl className="grid grid-cols-2 gap-3">
        <Campo nombre="Estado">{nombreEstado(reporte.estado)}</Campo>
        <Campo nombre="Nivel de emergencia">{nombreNivel(reporte.nivelEmergencia)}</Campo>
        <Campo nombre="Fecha">{formatearFecha(reporte.fecha)}</Campo>
        <Campo nombre="Ubicación">
          <span className="font-mono">{formatearCoordenada(coordenada)}</span>
        </Campo>
      </dl>

      <Link
        href={`/historial/detalle?id=${encodeURIComponent(reporte.id)}`}
        className="inline-block text-sm font-medium text-blue-600 hover:underline"
      >
        Ver en el histórico →
      </Link>
    </div>
  );
}
