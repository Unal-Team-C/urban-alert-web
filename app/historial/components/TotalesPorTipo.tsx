"use client";

import { useEffect, useRef, useState } from "react";
import type { CategoriaCatalogo } from "../../lib/catalogo";
import { contarPor, type FiltrosReportes } from "../../lib/reportes";

type Total = number | "error" | undefined;

// El catálogo tiene decenas de tipos: pedir el total de todos al abrir la página serían
// decenas de peticiones. Las categorías van plegadas y los totales de una categoría se
// piden solo la primera vez que se expande.
export default function TotalesPorTipo({
  catalogo,
  filtros,
  onSeleccionar,
}: {
  catalogo: CategoriaCatalogo[];
  filtros: FiltrosReportes;
  onSeleccionar: (filtro: keyof FiltrosReportes, valor: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());
  const [totales, setTotales] = useState<Record<string, Total>>({});
  const controlador = useRef<AbortController | null>(null);

  // Se crea dentro del efecto: en desarrollo React lo ejecuta, limpia y vuelve a ejecutar,
  // y un controlador creado fuera quedaría abortado para siempre.
  useEffect(() => {
    const actual = new AbortController();
    controlador.current = actual;
    return () => actual.abort();
  }, []);

  function cargar(codigos: string[]) {
    codigos.forEach((codigo) => {
      contarPor("tipo", codigo, controlador.current?.signal)
        .then((total) => setTotales((previos) => ({ ...previos, [codigo]: total })))
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setTotales((previos) => ({ ...previos, [codigo]: "error" }));
        });
    });
  }

  function alternar(categoria: CategoriaCatalogo) {
    const abierta = abiertas.has(categoria.codigo);
    setAbiertas((previas) => {
      const siguientes = new Set(previas);
      if (abierta) siguientes.delete(categoria.codigo);
      else siguientes.add(categoria.codigo);
      return siguientes;
    });
    if (!abierta) {
      cargar(categoria.tipos.map((tipo) => tipo.codigo).filter((codigo) => totales[codigo] === undefined));
    }
  }

  if (catalogo.length === 0) return null;

  return (
    <section aria-label="Totales por tipo">
      <button
        type="button"
        aria-expanded={visible}
        onClick={() => setVisible((v) => !v)}
        className="text-sm font-semibold uppercase text-gray-500 hover:text-gray-700"
      >
        Por tipo de reporte {visible ? "▲" : "▼"}
      </button>
      {visible && (
      <div className="mt-2 space-y-2">
        {catalogo.map((categoria) => {
          const abierta = abiertas.has(categoria.codigo);
          return (
            <div key={categoria.codigo} className="rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                aria-expanded={abierta}
                onClick={() => alternar(categoria)}
                className="flex w-full items-center justify-between p-3 text-left"
              >
                <span className="font-medium text-gray-900">{categoria.nombre}</span>
                <span className="text-sm text-gray-500">
                  {categoria.tipos.length} tipos {abierta ? "▲" : "▼"}
                </span>
              </button>
              {abierta && (
                <div className="grid grid-cols-1 gap-2 border-t border-gray-100 p-3 sm:grid-cols-2 lg:grid-cols-3">
                  {categoria.tipos.map((tipo) => {
                    const total = totales[tipo.codigo];
                    const activo = filtros.tipo === tipo.codigo;
                    return (
                      <button
                        key={tipo.codigo}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => onSeleccionar("tipo", activo ? "" : tipo.codigo)}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                          activo
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-white hover:border-gray-400"
                        }`}
                      >
                        <span className="text-gray-700">{tipo.nombre}</span>
                        {total === "error" ? (
                          <span
                            role="button"
                            tabIndex={0}
                            title="No se pudo cargar. Clic para reintentar"
                            onClick={(evento) => {
                              evento.stopPropagation();
                              cargar([tipo.codigo]);
                            }}
                            className="font-semibold text-red-600"
                          >
                            —
                          </span>
                        ) : (
                          <span className="font-semibold text-gray-900">{total ?? "…"}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}
