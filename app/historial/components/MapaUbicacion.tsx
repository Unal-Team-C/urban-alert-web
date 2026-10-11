"use client";

import dynamic from "next/dynamic";

const MapaUbicacionLeaflet = dynamic(() => import("./MapaUbicacionLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      Cargando mapa...
    </div>
  ),
});

export default function MapaUbicacion({ lat, lon }: { lat: number; lon: number }) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-gray-200">
      <MapaUbicacionLeaflet lat={lat} lon={lon} />
    </div>
  );
}
