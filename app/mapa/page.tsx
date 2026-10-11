"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

import { cargarLocalidades } from "../lib/localidades";
import { obtenerCatalogo } from "../lib/reportes";
import { useCarga } from "../lib/useCarga";
import { escribirVista, leerVista, type VistaMapa } from "../lib/vistaMapa";

function CargandoMapa() {
  return (
    <div className="flex h-full items-center justify-center text-gray-500">
      Cargando mapa...
    </div>
  );
}

// Leaflet usa window: el mapa se carga solo en el navegador.
const MapaDanos = dynamic(() => import("./components/MapaDanos"), {
  ssr: false,
  loading: CargandoMapa,
});

function Mapa() {
  const parametros = useSearchParams();
  // La URL solo define la vista inicial; luego el mapa la mantiene al día.
  const [vistaInicial] = useState(() => leerVista(new URLSearchParams(parametros.toString())));
  const catalogo = useCarga(obtenerCatalogo, "catalogo");
  const localidades = useCarga(cargarLocalidades, "localidades");

  // replaceState: la URL sigue al mapa sin navegar ni agregar una entrada por movimiento.
  const actualizarUrl = useCallback((vista: VistaMapa) => {
    window.history.replaceState(null, "", `${window.location.pathname}?${escribirVista(vista)}`);
  }, []);

  return (
    <main className="h-full w-full">
      <MapaDanos
        vistaInicial={vistaInicial}
        catalogo={catalogo.datos ?? []}
        localidades={localidades.datos ?? null}
        errorLocalidades={localidades.error?.message ?? null}
        onReintentarLocalidades={localidades.reintentar}
        onMover={actualizarUrl}
      />
    </main>
  );
}

export default function MapaPage() {
  return (
    <Suspense fallback={<CargandoMapa />}>
      <Mapa />
    </Suspense>
  );
}
