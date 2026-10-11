"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { dentroDeBogota, formatearCoordenada, type Coordenada } from "../lib/ubicacion";

// Leaflet depende de window: el mapa solo se renderiza en el navegador.
const MapaSelector = dynamic(() => import("./MapaSelector"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      Cargando mapa...
    </div>
  ),
});

type Props = {
  inicial: Coordenada | null;
  onGuardar: (coordenada: Coordenada) => void;
  onCerrar: () => void;
};

export default function SeleccionUbicacionModal({ inicial, onGuardar, onCerrar }: Props) {
  const [seleccion, setSeleccion] = useState<Coordenada | null>(inicial);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCerrar();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCerrar]);

  const fueraDeBogota = seleccion !== null && !dentroDeBogota(seleccion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="seleccion-ubicacion-titulo"
        className="flex h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-xl"
      >
        <div className="border-b border-gray-200 p-4">
          <h2 id="seleccion-ubicacion-titulo" className="text-lg font-bold text-gray-900">
            Seleccione la ubicación
          </h2>
          <p className="text-sm text-gray-500">
            Haga clic en el mapa sobre el lugar del reporte.
          </p>
        </div>

        <div className="min-h-0 flex-1">
          <MapaSelector value={seleccion} onChange={setSeleccion} />
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className={`text-sm ${fueraDeBogota ? "text-red-600" : "text-gray-600"}`}>
            {seleccion === null
              ? "Ningún punto seleccionado."
              : fueraDeBogota
                ? "El punto está fuera de Bogotá."
                : `Punto seleccionado: ${formatearCoordenada(seleccion)}`}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCerrar}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={seleccion === null || fueraDeBogota}
              onClick={() => seleccion && onGuardar(seleccion)}
              className="flex-1 rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 sm:flex-none"
            >
              Guardar ubicación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
