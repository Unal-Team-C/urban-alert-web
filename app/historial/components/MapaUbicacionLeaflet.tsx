"use client";

// Solo se carga en el navegador (Leaflet usa window): importarlo con next/dynamic y ssr: false.

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";

export default function MapaUbicacionLeaflet({ lat, lon }: { lat: number; lon: number }) {
  return (
    <MapContainer center={[lat, lon]} zoom={16} className="h-full w-full">
      {/* Teselas públicas de OpenStreetMap: requieren atribución y uso moderado. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker
        center={[lat, lon]}
        radius={9}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 }}
      />
    </MapContainer>
  );
}
