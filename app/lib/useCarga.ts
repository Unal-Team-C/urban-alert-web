"use client";

import { useEffect, useState } from "react";
import { esAbortError } from "./api";

type Resultado<T> = { clave: string; datos?: T; error?: { status: number; message: string } };

// Carga un recurso y lo vuelve a pedir cuando cambia `clave`. Cada sección de una página
// usa su propia instancia, así una falla no afecta a las demás. "cargando" se deriva de que
// el último resultado no sea el de la clave actual (sin setState síncrono en el efecto).
export function useCarga<T>(cargar: (signal: AbortSignal) => Promise<T>, clave: string | null) {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);
  const [intento, setIntento] = useState(0);
  const claveCompleta = clave === null ? null : `${clave}#${intento}`;

  useEffect(() => {
    if (claveCompleta === null) return;
    const controlador = new AbortController();
    cargar(controlador.signal)
      .then((datos) => setResultado({ clave: claveCompleta, datos }))
      .catch((e: { status?: number; message?: string }) => {
        if (esAbortError(e)) return;
        setResultado({
          clave: claveCompleta,
          error: { status: e.status ?? 0, message: e.message ?? "Error inesperado." },
        });
      });
    return () => controlador.abort();
    // `cargar` es una closure nueva en cada render; la identidad de la petición es `clave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveCompleta]);

  const vigente = resultado?.clave === claveCompleta ? resultado : null;
  return {
    datos: vigente?.datos,
    error: vigente?.error,
    cargando: claveCompleta !== null && vigente === null,
    reintentar: () => setIntento((n) => n + 1),
  };
}
