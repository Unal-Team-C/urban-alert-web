"use client";

import { useCallback, useEffect, useState } from "react";
import { ESTADOS, NIVELES } from "../../lib/catalogo";
import { contarPor, type FiltrosReportes } from "../../lib/reportes";

type Tarjeta = { filtro: keyof FiltrosReportes; codigo: string; nombre: string };
type Total = number | "error" | undefined;

const TARJETAS: Tarjeta[] = [
  ...ESTADOS.map((e) => ({ filtro: "estado" as const, ...e })),
  ...NIVELES.map((n) => ({ filtro: "nivelEmergencia" as const, ...n })),
];

const clave = (t: Tarjeta) => `${t.filtro}:${t.codigo}`;

export default function TotalesGrid({
  filtros,
  onSeleccionar,
}: {
  filtros: FiltrosReportes;
  onSeleccionar: (filtro: keyof FiltrosReportes, valor: string) => void;
}) {
  const [totales, setTotales] = useState<Record<string, Total>>({});

  const cargar = useCallback((tarjetas: Tarjeta[], signal?: AbortSignal) => {
    tarjetas.forEach((tarjeta) => {
      contarPor(tarjeta.filtro, tarjeta.codigo, signal)
        .then((total) => setTotales((previos) => ({ ...previos, [clave(tarjeta)]: total })))
        .catch((error) => {
          if (error?.name === "AbortError") return;
          setTotales((previos) => ({ ...previos, [clave(tarjeta)]: "error" }));
        });
    });
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    cargar(TARJETAS, controlador.signal);
    return () => controlador.abort();
  }, [cargar]);

  function renderTarjeta(tarjeta: Tarjeta) {
    const total = totales[clave(tarjeta)];
    const activa = filtros[tarjeta.filtro] === tarjeta.codigo;
    return (
      <button
        key={clave(tarjeta)}
        type="button"
        aria-pressed={activa}
        onClick={() => onSeleccionar(tarjeta.filtro, activa ? "" : tarjeta.codigo)}
        className={`rounded-xl border p-4 text-left shadow-sm transition ${
          activa ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-400"
        }`}
      >
        <span className="block text-sm text-gray-500">{tarjeta.nombre}</span>
        {total === "error" ? (
          <span
            role="button"
            tabIndex={0}
            title="No se pudo cargar. Clic para reintentar"
            onClick={(evento) => {
              evento.stopPropagation();
              cargar([tarjeta]);
            }}
            className="text-2xl font-semibold text-red-600"
          >
            —
          </span>
        ) : (
          <span className="text-2xl font-semibold text-gray-900">{total ?? "…"}</span>
        )}
      </button>
    );
  }

  return (
    <section aria-label="Totales" className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Por estado</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TARJETAS.filter((t) => t.filtro === "estado").map(renderTarjeta)}
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">
          Por nivel de emergencia
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TARJETAS.filter((t) => t.filtro === "nivelEmergencia").map(renderTarjeta)}
        </div>
      </div>
    </section>
  );
}
