"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useRef, useState } from "react";

import PanelDano from "../mapa/components/PanelDano";
import type { DanoCercano } from "../lib/geoespacial";
import { cargarLocalidades } from "../lib/localidades";
import { obtenerCatalogo } from "../lib/reportes";
import { useCarga } from "../lib/useCarga";
import { listarUsuarios } from "../lib/usuarios";
import { escribirVista, guardarUltimaVista, leerVista, type VistaMapa } from "../lib/vistaMapa";
import BarraSuperior from "./BarraSuperior";

function CargandoMapa() {
  return <div className="flex flex-1 items-center justify-center text-gray-500">Cargando mapa...</div>;
}

// Leaflet usa window: el mapa se carga solo en el navegador.
const MapaDanos = dynamic(() => import("../mapa/components/MapaDanos"), {
  ssr: false,
  loading: CargandoMapa,
});

// Pantalla principal (/ y /mapa, spec 002-rediseno-mapa): barra superior y, debajo, el mapa a pantalla completa
// con el detalle del daño pulsado en un panel a la derecha (abajo en pantallas estrechas).
export default function PantallaMapa() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-gray-100 text-gray-900">
      <BarraSuperior>
        <Link
          href="/reportes/nuevo"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Crear reporte
        </Link>
      </BarraSuperior>
      <Suspense fallback={<CargandoMapa />}>
        <VistaMapa />
      </Suspense>
    </div>
  );
}

function VistaMapa() {
  const parametros = useSearchParams();
  // La URL solo define la vista inicial; luego el mapa la mantiene al día.
  const [vistaInicial] = useState(() => leerVista(new URLSearchParams(parametros.toString())));
  const catalogo = useCarga(obtenerCatalogo, "catalogo");
  const localidades = useCarga(cargarLocalidades, "localidades");
  // Para «Reportado por»: una sola vez por pantalla, como en el histórico.
  const usuarios = useCarga(listarUsuarios, "usuarios");
  const [seleccionado, setSeleccionado] = useState<DanoCercano | null>(null);
  const contenedorMapa = useRef<HTMLDivElement>(null);

  // replaceState: la URL sigue al mapa sin navegar ni agregar una entrada por movimiento. La vista también se
  // guarda en el navegador para «Volver al mapa» desde el formulario.
  const alMover = useCallback((vista: VistaMapa) => {
    window.history.replaceState(null, "", `${window.location.pathname}?${escribirVista(vista)}`);
    guardarUltimaVista(vista);
  }, []);

  // Al cerrar el panel, el foco vuelve al mapa (Leaflet hace su contenedor enfocable).
  const cerrar = useCallback(() => {
    setSeleccionado(null);
    contenedorMapa.current?.querySelector<HTMLElement>(".leaflet-container")?.focus();
  }, []);

  return (
    <main className="relative flex min-h-0 flex-1">
      <div ref={contenedorMapa} className="relative min-w-0 flex-1">
        <MapaDanos
          vistaInicial={vistaInicial}
          localidades={localidades.datos ?? null}
          errorLocalidades={localidades.error?.message ?? null}
          onReintentarLocalidades={localidades.reintentar}
          onMover={alMover}
          seleccionado={seleccionado?.reportId ?? null}
          onSeleccionar={setSeleccionado}
        />
      </div>
      {seleccionado && (
        // < md: hoja inferior sobre el mapa (60 % del alto); md+: columna de 400 px que estrecha el mapa.
        <div className="absolute inset-x-0 bottom-0 z-[1100] h-[60%] overflow-hidden rounded-t-xl border-t border-gray-200 shadow-2xl md:static md:z-auto md:h-auto md:w-[400px] md:shrink-0 md:rounded-none md:border-l md:border-t-0 md:shadow-none">
          <PanelDano
            reportId={seleccionado.reportId}
            coordenada={seleccionado.coordinate}
            catalogo={catalogo.datos ?? []}
            usuarios={usuarios.datos ?? []}
            onCerrar={cerrar}
          />
        </div>
      )}
    </main>
  );
}
