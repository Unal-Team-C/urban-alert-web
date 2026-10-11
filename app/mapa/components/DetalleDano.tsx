"use client";

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

type Props = {
  reportId: string;
  coordenada: Coordenada;
  catalogo: CategoriaCatalogo[];
};

function Campo({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{nombre}</dt>
      <dd className="text-sm text-gray-900">{children}</dd>
    </div>
  );
}

// Contenido del popup de un daño. Se monta al abrir el popup, así el reporte se pide solo
// cuando el usuario hace clic en el punto. Leaflet mide el popup al abrirlo y no al cambiar el
// contenido: todos los estados tienen el mismo ancho. Se usa <div> y no <p> porque Leaflet
// da márgenes grandes a los <p> del popup.
export default function DetalleDano(props: Props) {
  return (
    <div className="w-64 text-gray-900">
      <Contenido {...props} />
    </div>
  );
}

function Contenido({ reportId, coordenada, catalogo }: Props) {
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
    <>
      <div className="text-base font-semibold">{nombreTipo(catalogo, reporte.tipo)}</div>
      <div className="mb-2 text-xs text-gray-500">{nombreCategoria(catalogo, reporte.categoria)}</div>
      <dl className="space-y-1.5">
        <Campo nombre="Descripción">{reporte.descripcion}</Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo nombre="Estado">{nombreEstado(reporte.estado)}</Campo>
          <Campo nombre="Nivel de emergencia">{nombreNivel(reporte.nivelEmergencia)}</Campo>
        </div>
        <Campo nombre="Fecha">{formatearFecha(reporte.fecha)}</Campo>
        <Campo nombre="Ubicación">
          <span className="font-mono">{formatearCoordenada(coordenada)}</span>
        </Campo>
      </dl>
      {reporte.urlImagen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={reporte.urlImagen}
          alt="Imagen del reporte"
          onError={(evento) => {
            evento.currentTarget.style.display = "none"; // URL rota: no mostrar el ícono de imagen rota
          }}
          className="mt-2 max-h-40 w-full rounded-lg object-cover"
        />
      )}
    </>
  );
}
