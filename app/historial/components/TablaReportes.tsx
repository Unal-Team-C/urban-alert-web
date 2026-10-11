import Link from "next/link";
import {
  nombreCategoria,
  nombreEstado,
  nombreNivel,
  nombreTipo,
  type CategoriaCatalogo,
} from "../../lib/catalogo";
import { formatearFecha } from "../../lib/formato";
import { TAMANO_PAGINA, type Pagina, type Reporte } from "../../lib/reportes";

export default function TablaReportes({
  datos,
  catalogo,
  onPagina,
}: {
  datos: Pagina<Reporte>;
  catalogo: CategoriaCatalogo[];
  onPagina: (pagina: number) => void;
}) {
  const totalPaginas = Math.max(1, Math.ceil(datos.totalElementos / TAMANO_PAGINA));

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Categoría / tipo</th>
              <th className="p-3">Descripción</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Nivel</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {datos.elementos.map((reporte) => (
              <tr key={reporte.id} className="border-t border-gray-100">
                <td className="p-3 whitespace-nowrap">{formatearFecha(reporte.fecha)}</td>
                <td className="p-3">
                  <span className="block font-medium">{nombreTipo(catalogo, reporte.tipo)}</span>
                  <span className="text-gray-500">{nombreCategoria(catalogo, reporte.categoria)}</span>
                </td>
                <td className="max-w-xs truncate p-3" title={reporte.descripcion}>
                  {reporte.descripcion}
                </td>
                <td className="p-3">{nombreEstado(reporte.estado)}</td>
                <td className="p-3">{nombreNivel(reporte.nivelEmergencia)}</td>
                <td className="p-3">
                  <Link href={`/historial/${reporte.id}`} className="text-blue-600 hover:underline">
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Paginación" className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Página {datos.pagina} de {totalPaginas} · {datos.totalElementos} reportes
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={datos.pagina <= 1}
            onClick={() => onPagina(datos.pagina - 1)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={datos.pagina >= totalPaginas}
            onClick={() => onPagina(datos.pagina + 1)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </div>
  );
}
