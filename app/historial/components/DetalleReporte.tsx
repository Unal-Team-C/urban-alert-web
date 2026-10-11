import {
  nombreCategoria,
  nombreEstado,
  nombreNivel,
  nombreTipo,
  type CategoriaCatalogo,
} from "../../lib/catalogo";
import { formatearFecha } from "../../lib/formato";
import type { Coordenada } from "../../lib/geoespacial";
import type { Reporte } from "../../lib/reportes";
import { nombreDeUsuario, type Usuario } from "../../lib/usuarios";
import MapaUbicacion from "./MapaUbicacion";

function Campo({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{nombre}</dt>
      <dd className="text-gray-900">{children}</dd>
    </div>
  );
}

export default function DetalleReporte({
  reporte,
  catalogo,
  usuarios,
  coordenada,
  errorCoordenada,
}: {
  reporte: Reporte;
  catalogo: CategoriaCatalogo[];
  usuarios: Usuario[];
  coordenada?: Coordenada;
  errorCoordenada?: boolean;
}) {
  return (
    <section aria-labelledby="titulo-detalle" className="rounded-xl bg-white p-6 shadow">
      <h2 id="titulo-detalle" className="mb-4 text-xl font-semibold text-gray-900">
        {nombreTipo(catalogo, reporte.tipo)}
      </h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Campo nombre="Categoría">{nombreCategoria(catalogo, reporte.categoria)}</Campo>
        <Campo nombre="Fecha">{formatearFecha(reporte.fecha)}</Campo>
        <Campo nombre="Estado">{nombreEstado(reporte.estado)}</Campo>
        <Campo nombre="Nivel de emergencia">{nombreNivel(reporte.nivelEmergencia)}</Campo>
        <Campo nombre="Reportado por">{nombreDeUsuario(usuarios, reporte.idUsuario)}</Campo>
        <Campo nombre="Responsable">
          {reporte.idResponsable ? nombreDeUsuario(usuarios, reporte.idResponsable) : "Sin asignar"}
        </Campo>
        <Campo nombre="Ubicación">
          {coordenada
            ? `${coordenada.coordinate.lat.toFixed(5)}, ${coordenada.coordinate.lon.toFixed(5)}`
            : errorCoordenada
              ? "No disponible"
              : "Cargando..."}
        </Campo>
        {reporte.motivoRechazo && <Campo nombre="Motivo de rechazo">{reporte.motivoRechazo}</Campo>}
        <div className="sm:col-span-2">
          <Campo nombre="Descripción">{reporte.descripcion}</Campo>
        </div>
      </dl>

      {coordenada && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">Ubicación en el mapa</p>
          <MapaUbicacion lat={coordenada.coordinate.lat} lon={coordenada.coordinate.lon} />
        </div>
      )}

      {reporte.urlImagen && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-gray-500">Imagen</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={reporte.urlImagen}
            alt="Imagen del reporte"
            onError={(evento) => {
              evento.currentTarget.style.display = "none"; // URL rota: no mostrar el ícono de imagen rota
            }}
            className="max-h-96 rounded-lg object-contain"
          />
        </div>
      )}
    </section>
  );
}
