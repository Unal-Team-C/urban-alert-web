"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { esAbortError } from "../lib/api";
import { ancestros, celdasVisibles, enCelda, type Celda, type Limites } from "../lib/celdas";
import { listarCercanos, type DanoCercano } from "../lib/geoespacial";

// Una celda cargada se reutiliza durante este tiempo; después se vuelve a pedir.
export const TTL_CELDA_MS = 60_000;

export type VistaDatos = { limites: Limites; zoom: number };

export type EstadoArea = "lista" | "cargando" | "fallida";

// `puntos: null` = la celda falló sin datos previos. `peticion` es el número de la petición que
// escribió la entrada (también si falló). `intentoFallido` evita reintentar una celda que falló
// hasta que el usuario pida reintentar.
type Entrada = { puntos: DanoCercano[] | null; hora: number; peticion: number; intentoFallido?: number };

type Peticion = { controlador: AbortController; numero: number };

type Datos = { puntos: DanoCercano[]; hora: number };

const SIN_AREAS: Limites[] = [];

// Datos más recientes para la celda: los suyos o los de un ancestro, filtrados a la celda.
function datosDe(celda: Celda, entradas: Map<string, Entrada>): Datos | null {
  let mejor: { celda: Celda; puntos: DanoCercano[]; hora: number } | null = null;
  for (const candidata of [celda, ...ancestros(celda)]) {
    const entrada = entradas.get(candidata.clave);
    if (entrada?.puntos && (!mejor || entrada.hora > mejor.hora)) {
      mejor = { celda: candidata, puntos: entrada.puntos, hora: entrada.hora };
    }
  }
  if (!mejor) return null;
  const puntos =
    mejor.celda === celda ? mejor.puntos : mejor.puntos.filter((p) => enCelda(celda, p.coordinate));
  return { puntos, hora: mejor.hora };
}

function fallida(celda: Celda, entradas: Map<string, Entrada>, datos: Datos | null): boolean {
  const propia = entradas.get(celda.clave);
  return propia?.intentoFallido !== undefined && !(datos && datos.hora > propia.hora);
}

// Daños de la vista: divide la vista en celdas, pide a Geoespacial las que no están en caché
// (o tienen un ancestro fresco) y junta los puntos. Una celda que falla no oculta las demás.
// `areas` se cargan completas aunque salgan de la vista (p. ej. las localidades visibles, para
// contar todos sus daños); `estadoDe` dice si un área ya está cargada.
export function useDanosVisibles(vista: VistaDatos | null, areas: Limites[] = SIN_AREAS) {
  const [entradas, setEntradas] = useState(() => new Map<string, Entrada>());
  const [intento, setIntento] = useState(0);
  const enVuelo = useRef(new Map<string, Peticion>());
  const ultimaPeticion = useRef(0);

  const celdas = useMemo(() => {
    if (!vista) return [];
    const unicas = new Map<string, Celda>();
    for (const limites of [vista.limites, ...areas]) {
      for (const celda of celdasVisibles(limites, vista.zoom)) unicas.set(celda.clave, celda);
    }
    return [...unicas.values()];
  }, [vista, areas]);

  // Una petición en curso no se cancela al mover el mapa: termina y queda en caché, así una
  // vista que cambia y vuelve no repite peticiones. Solo se cancelan al desmontar.
  useEffect(() => {
    const vuelo = enVuelo.current;
    // Una celda deja de estar en vuelo cuando su respuesta ya está en `entradas`, no cuando
    // llega: si no, un render intermedio la vería sin datos ni petición y la pediría otra vez.
    for (const [clave, peticion] of vuelo) {
      if ((entradas.get(clave)?.peticion ?? 0) >= peticion.numero) vuelo.delete(clave);
    }

    const ahora = Date.now();
    for (const celda of celdas) {
      if (vuelo.has(celda.clave)) continue;
      const datos = datosDe(celda, entradas);
      if (datos && ahora - datos.hora < TTL_CELDA_MS) continue;
      if (entradas.get(celda.clave)?.intentoFallido === intento) continue;

      const controlador = new AbortController();
      const numero = ++ultimaPeticion.current;
      vuelo.set(celda.clave, { controlador, numero });
      listarCercanos(celda.centro, celda.radio, controlador.signal)
        .then((lista) => {
          const puntos = lista.filter((p) => enCelda(celda, p.coordinate));
          setEntradas((previas) =>
            new Map(previas).set(celda.clave, { puntos, hora: Date.now(), peticion: numero })
          );
        })
        .catch((error) => {
          if (esAbortError(error)) return;
          setEntradas((previas) => {
            const anterior = previas.get(celda.clave);
            return new Map(previas).set(celda.clave, {
              puntos: anterior?.puntos ?? null,
              hora: anterior?.hora ?? 0,
              peticion: numero,
              intentoFallido: intento,
            });
          });
        });
    }
  }, [celdas, entradas, intento]);

  useEffect(() => {
    const vuelo = enVuelo.current;
    return () => {
      for (const { controlador } of vuelo.values()) controlador.abort();
      vuelo.clear();
    };
  }, []);

  return useMemo(() => {
    const porId = new Map<string, DanoCercano>();
    const estados = new Map<string, EstadoArea>();
    for (const celda of celdas) {
      const datos = datosDe(celda, entradas);
      estados.set(celda.clave, fallida(celda, entradas, datos) ? "fallida" : datos ? "lista" : "cargando");
      for (const punto of datos?.puntos ?? []) porId.set(punto.reportId, punto);
    }
    const valores = [...estados.values()];
    const zoom = vista?.zoom ?? 0;
    return {
      puntos: [...porId.values()],
      cargando: valores.includes("cargando"),
      celdasFallidas: valores.filter((e) => e === "fallida").length,
      reintentar: () => setIntento((n) => n + 1),
      estadoDe: (limites: Limites): EstadoArea => {
        const propias = celdasVisibles(limites, zoom).map((c) => estados.get(c.clave) ?? "cargando");
        return propias.includes("cargando") ? "cargando" : propias.includes("fallida") ? "fallida" : "lista";
      },
    };
  }, [celdas, entradas, vista]);
}
