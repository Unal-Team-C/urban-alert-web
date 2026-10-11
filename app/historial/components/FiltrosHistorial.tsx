import { ESTADOS, NIVELES } from "../../lib/catalogo";
import type { CategoriaCatalogo } from "../../lib/catalogo";
import type { FiltrosReportes } from "../../lib/reportes";

const CLASE = "rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900";

export default function FiltrosHistorial({
  filtros,
  catalogo,
  onCambiar,
}: {
  filtros: FiltrosReportes;
  catalogo: CategoriaCatalogo[];
  onCambiar: (filtro: keyof FiltrosReportes, valor: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Estado</span>
        <select
          className={CLASE}
          value={filtros.estado ?? ""}
          onChange={(e) => onCambiar("estado", e.target.value)}
        >
          <option value="">Todos</option>
          {ESTADOS.map((e) => (
            <option key={e.codigo} value={e.codigo}>
              {e.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Nivel de emergencia</span>
        <select
          className={CLASE}
          value={filtros.nivelEmergencia ?? ""}
          onChange={(e) => onCambiar("nivelEmergencia", e.target.value)}
        >
          <option value="">Todos</option>
          {NIVELES.map((n) => (
            <option key={n.codigo} value={n.codigo}>
              {n.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-gray-700">
        <span className="mb-1 block">Tipo</span>
        <select
          className={`${CLASE} max-w-64`}
          value={filtros.tipo ?? ""}
          onChange={(e) => onCambiar("tipo", e.target.value)}
        >
          <option value="">Todos</option>
          {catalogo.map((categoria) => (
            <optgroup key={categoria.codigo} label={categoria.nombre}>
              {categoria.tipos.map((tipo) => (
                <option key={tipo.codigo} value={tipo.codigo}>
                  {tipo.nombre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
    </div>
  );
}
