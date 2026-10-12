"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { hrefUltimaVista } from "../lib/vistaMapa";

// La última vista solo cambia en otra pantalla (el mapa): no hace falta suscribirse a cambios.
const sinSuscripcion = () => () => {};

// Enlace a la página principal en la última vista del mapa (spec 002-rediseno-mapa, RF-012 y RF-020). El HTML
// exportado se genera sin navegador y lleva "/"; en el navegador se lee la vista guardada.
export default function VolverAlMapa({ texto }: { texto: string }) {
  const href = useSyncExternalStore(sinSuscripcion, hrefUltimaVista, () => "/");
  return (
    <Link href={href} className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
      {texto}
    </Link>
  );
}
