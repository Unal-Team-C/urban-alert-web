"use client";

// Solo se carga en el navegador (Leaflet usa window): importarlo con next/dynamic y ssr: false.

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

import type { CategoriaCatalogo } from "../../lib/catalogo";
import type { Limites } from "../../lib/celdas";
import type { DanoCercano } from "../../lib/geoespacial";
import {
  ATRIBUCION_LOCALIDADES,
  contarPorLocalidad,
  seIntersecan,
  type Localidad,
} from "../../lib/localidades";
import { LIMITES_BOGOTA } from "../../lib/ubicacion";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_PUNTOS, type VistaMapa } from "../../lib/vistaMapa";
import { useDanosVisibles, type EstadoArea, type VistaDatos } from "../useDanosVisibles";
import DetalleDano from "./DetalleDano";

type Props = {
  vistaInicial: VistaMapa;
  catalogo: CategoriaCatalogo[];
  // null mientras cargan (o si fallaron): sin localidades no hay burbujas.
  localidades: Localidad[] | null;
  errorLocalidades: string | null;
  onReintentarLocalidades: () => void;
  onMover: (vista: VistaMapa) => void;
};

// Igual que el selector de ubicación: no deja alejarse de Bogotá.
const LIMITES_MAPA: [[number, number], [number, number]] = [
  [LIMITES_BOGOTA.latMin - 0.1, LIMITES_BOGOTA.lonMin - 0.1],
  [LIMITES_BOGOTA.latMax + 0.1, LIMITES_BOGOTA.lonMax + 0.1],
];

// Espera tras terminar de mover el mapa antes de pedir datos.
const ESPERA_MOVIMIENTO_MS = 250;

const FORMATO_CANTIDAD = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

// Informa la vista (límites y zoom) al cargar el mapa y cada vez que termina de moverse.
function SeguirVista({ onVista }: { onVista: (vista: VistaDatos & VistaMapa) => void }) {
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const map = useMapEvents({
    moveend() {
      programar();
    },
  });

  function programar(espera = ESPERA_MOVIMIENTO_MS) {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const limites = map.getBounds();
      const centro = map.getCenter();
      onVista({
        limites: {
          latMin: limites.getSouth(),
          latMax: limites.getNorth(),
          lonMin: limites.getWest(),
          lonMax: limites.getEast(),
        },
        zoom: map.getZoom(),
        lat: centro.lat,
        lon: centro.lng,
      });
    }, espera);
  }

  useEffect(() => {
    programar(0);
    return () => clearTimeout(temporizador.current);
    // Solo al montar: los movimientos posteriores llegan por moveend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

// La descripción va dentro del ícono: react-leaflet no actualiza `title` ni `alt` de un marcador
// ya creado, pero sí cambia el ícono cuando llega el conteo.
function iconoBurbuja(cantidad: number | null, descripcion: string): L.DivIcon {
  const diametro = Math.round(32 + 10 * Math.log10(Math.max(cantidad ?? 1, 1)));
  const color = cantidad === 0 ? "bg-gray-500/85" : "bg-red-600/85";
  const texto = cantidad === null ? "…" : FORMATO_CANTIDAD.format(cantidad);
  const etiqueta = escaparHtml(descripcion);
  return L.divIcon({
    className: "",
    iconSize: [diametro, diametro],
    html: `<div title="${etiqueta}" aria-label="${etiqueta}" class="flex h-full w-full items-center justify-center rounded-full border-2 border-white ${color} text-xs font-semibold text-white shadow-md">${texto}</div>`,
  });
}

// Por debajo del zoom de calles: contorno de cada localidad visible y una burbuja con el total
// de daños de la localidad completa (mientras falte alguna de sus celdas, "…"). Los puntos se
// asignan contra todas las localidades, no solo las visibles.
function CapaLocalidades({
  localidades,
  visibles,
  puntos,
  estadoDe,
}: {
  localidades: Localidad[];
  visibles: Localidad[];
  puntos: DanoCercano[];
  estadoDe: (limites: Limites) => EstadoArea;
}) {
  const map = useMap();
  const totales = useMemo(
    () => contarPorLocalidad(localidades, puntos.map((p) => p.coordinate)),
    [localidades, puntos]
  );

  return visibles.map((localidad) => {
    const estado = estadoDe(localidad.limites);
    const cantidad = estado === "cargando" ? null : (totales.get(localidad.codigo) ?? 0);
    const descripcion =
      cantidad === null
        ? `${localidad.nombre}: cargando daños`
        : `${localidad.nombre}: ${cantidad.toLocaleString("es-CO")} ${cantidad === 1 ? "daño" : "daños"}${estado === "fallida" ? " (conteo parcial)" : ""}`;
    return (
      <Fragment key={localidad.codigo}>
        <Polygon
          positions={localidad.poligonos}
          pathOptions={{ color: "#4b5563", weight: 1.5, fillColor: "#6b7280", fillOpacity: 0.05 }}
        >
          <Tooltip sticky>{localidad.nombre}</Tooltip>
        </Polygon>
        <Marker
          position={[localidad.etiqueta.lat, localidad.etiqueta.lon]}
          icon={iconoBurbuja(cantidad, descripcion)}
          eventHandlers={{
            click: () => {
              const { latMin, latMax, lonMin, lonMax } = localidad.limites;
              map.fitBounds(
                [
                  [latMin, lonMin],
                  [latMax, lonMax],
                ],
                { maxZoom: ZOOM_PUNTOS }
              );
            },
          }}
        />
      </Fragment>
    );
  });
}

function CapaPuntos({ puntos, catalogo }: { puntos: DanoCercano[]; catalogo: CategoriaCatalogo[] }) {
  return puntos.map((punto) => (
    <CircleMarker
      key={punto.reportId}
      center={[punto.coordinate.lat, punto.coordinate.lon]}
      radius={7}
      pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#dc2626", fillOpacity: 1 }}
    >
      <Popup minWidth={256} maxWidth={256}>
        <DetalleDano reportId={punto.reportId} coordenada={punto.coordinate} catalogo={catalogo} />
      </Popup>
    </CircleMarker>
  ));
}

function Aviso({ texto, onReintentar }: { texto: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="pointer-events-auto rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 shadow">
      <div>{texto}</div>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-2 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}

function Estado({
  cantidad,
  cargando,
  celdasFallidas,
  onReintentar,
  errorLocalidades,
  onReintentarLocalidades,
}: {
  cantidad: number;
  cargando: boolean;
  celdasFallidas: number;
  onReintentar: () => void;
  errorLocalidades: string | null;
  onReintentarLocalidades: () => void;
}) {
  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex max-w-xs flex-col items-end gap-2 text-sm">
      <p role="status" className="rounded-lg bg-white px-3 py-2 text-gray-700 shadow">
        {cargando
          ? "Cargando daños..."
          : cantidad === 0 && celdasFallidas === 0
            ? "No hay daños reportados en esta zona"
            : `${cantidad.toLocaleString("es-CO")} ${cantidad === 1 ? "daño" : "daños"} en esta zona`}
      </p>
      {celdasFallidas > 0 && (
        <Aviso texto="No se pudieron cargar los daños de parte del mapa." onReintentar={onReintentar} />
      )}
      {errorLocalidades && (
        <Aviso
          texto={`No se pudieron cargar las localidades: ${errorLocalidades}`}
          onReintentar={onReintentarLocalidades}
        />
      )}
    </div>
  );
}

export default function MapaDanos({
  vistaInicial,
  catalogo,
  localidades,
  errorLocalidades,
  onReintentarLocalidades,
  onMover,
}: Props) {
  const [vista, setVista] = useState<(VistaDatos & VistaMapa) | null>(null);
  const zoom = vista?.zoom ?? vistaInicial.zoom;

  // Por debajo del zoom de calles se cargan completas las localidades que toca la vista.
  const localidadesVisibles = useMemo(
    () =>
      vista && localidades && zoom < ZOOM_PUNTOS
        ? localidades.filter((l) => seIntersecan(l.limites, vista.limites))
        : [],
    [localidades, vista, zoom]
  );
  const areas = useMemo(() => localidadesVisibles.map((l) => l.limites), [localidadesVisibles]);
  const { puntos, cargando, celdasFallidas, reintentar, estadoDe } = useDanosVisibles(vista, areas);

  // Solo los puntos dentro de la vista cuentan para el total.
  const enVista = useMemo(() => {
    if (!vista) return 0;
    const { latMin, latMax, lonMin, lonMax } = vista.limites;
    return puntos.filter(
      ({ coordinate: { lat, lon } }) => lat >= latMin && lat <= latMax && lon >= lonMin && lon <= lonMax
    ).length;
  }, [puntos, vista]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[vistaInicial.lat, vistaInicial.lon]}
        zoom={vistaInicial.zoom}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        maxBounds={LIMITES_MAPA}
        maxBoundsViscosity={1}
        preferCanvas
        className="h-full w-full"
      >
        {/* Teselas públicas de OpenStreetMap: requieren atribución y uso moderado. */}
        <TileLayer
          attribution={`&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | ${ATRIBUCION_LOCALIDADES}`}
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <SeguirVista
          onVista={(nueva) => {
            setVista(nueva);
            onMover({ lat: nueva.lat, lon: nueva.lon, zoom: nueva.zoom });
          }}
        />

        {zoom < ZOOM_PUNTOS ? (
          localidades && (
            <CapaLocalidades
              localidades={localidades}
              visibles={localidadesVisibles}
              puntos={puntos}
              estadoDe={estadoDe}
            />
          )
        ) : (
          <CapaPuntos puntos={puntos} catalogo={catalogo} />
        )}
      </MapContainer>

      {vista && (
        <Estado
          cantidad={enVista}
          cargando={cargando || (zoom < ZOOM_PUNTOS && !localidades && !errorLocalidades)}
          celdasFallidas={celdasFallidas}
          onReintentar={reintentar}
          errorLocalidades={errorLocalidades}
          onReintentarLocalidades={onReintentarLocalidades}
        />
      )}
    </div>
  );
}
