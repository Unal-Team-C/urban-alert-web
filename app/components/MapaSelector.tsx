"use client";

// Solo se carga en el navegador (Leaflet usa window): importarlo con next/dynamic y ssr: false.

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

import { CENTRO_BOGOTA, LIMITES_BOGOTA, type Coordenada } from "../lib/ubicacion";

type Props = {
  value: Coordenada | null;
  onChange: (coordenada: Coordenada) => void;
};

// El mapa no deja alejarse de Bogotá; un margen evita que el borde quede pegado al límite.
const LIMITES_MAPA: [[number, number], [number, number]] = [
  [LIMITES_BOGOTA.latMin - 0.1, LIMITES_BOGOTA.lonMin - 0.1],
  [LIMITES_BOGOTA.latMax + 0.1, LIMITES_BOGOTA.lonMax + 0.1],
];

function SeleccionPorClic({ onChange }: Pick<Props, "onChange">) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
  });
  return null;
}

export default function MapaSelector({ value, onChange }: Props) {
  const centro = value ?? CENTRO_BOGOTA;

  return (
    <MapContainer
      center={[centro.lat, centro.lon]}
      zoom={value ? 16 : 12}
      minZoom={10}
      maxBounds={LIMITES_MAPA}
      maxBoundsViscosity={1}
      className="h-full w-full"
    >
      {/* Teselas públicas de OpenStreetMap: requieren atribución y uso moderado. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SeleccionPorClic onChange={onChange} />

      {value && (
        <CircleMarker
          center={[value.lat, value.lon]}
          radius={9}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#dc2626", fillOpacity: 1 }}
        />
      )}
    </MapContainer>
  );
}
