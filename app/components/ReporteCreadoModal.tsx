"use client";

import { useEffect, useRef } from "react";

type Props = {
  idReporte: string;
  onClose: () => void;
};

// Confirmación de reporte creado. Se cierra con "Aceptar", con Escape o con
// un clic fuera del cuadro.
export default function ReporteCreadoModal({ idReporte, onClose }: Props) {
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    botonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reporte-creado-titulo"
        className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            className="h-6 w-6 text-green-600"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 id="reporte-creado-titulo" className="text-xl font-bold text-gray-900">
          Reporte creado
        </h2>

        <p className="mt-2 text-gray-600">
          Su reporte se registró correctamente.
        </p>

        <p className="mt-3 text-xs text-gray-400">
          Número de reporte:
          <span className="block font-mono">{idReporte}</span>
        </p>

        <button
          ref={botonRef}
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-gray-800"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
