export type Coordenada = { lat: number; lon: number };

export type OrigenUbicacion = "mapa" | "gps";

export type Ubicacion = Coordenada & {
  origen: OrigenUbicacion;
  // Radio de incertidumbre en metros que informa el GPS del dispositivo.
  precisionMetros?: number;
};

// Mismo rango que valida el servicio Geoespacial (Distrito Capital, incluido Sumapaz).
export const LIMITES_BOGOTA = {
  latMin: 3.72,
  latMax: 4.84,
  lonMin: -74.46,
  lonMax: -73.98,
};

export const CENTRO_BOGOTA: Coordenada = { lat: 4.711, lon: -74.0721 };

export function dentroDeBogota({ lat, lon }: Coordenada): boolean {
  return (
    lat >= LIMITES_BOGOTA.latMin &&
    lat <= LIMITES_BOGOTA.latMax &&
    lon >= LIMITES_BOGOTA.lonMin &&
    lon <= LIMITES_BOGOTA.lonMax
  );
}

export function formatearCoordenada({ lat, lon }: Coordenada): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

// Traduce los errores de navigator.geolocation a mensajes para el usuario.
export function mensajeErrorGps(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "No se dio permiso para usar la ubicación. Habilítelo en el navegador o seleccione el punto en el mapa.";
    case error.POSITION_UNAVAILABLE:
      return "No fue posible determinar la ubicación del dispositivo. Seleccione el punto en el mapa.";
    case error.TIMEOUT:
      return "La ubicación tardó demasiado en obtenerse. Intente de nuevo o seleccione el punto en el mapa.";
    default:
      return "No fue posible obtener la ubicación. Seleccione el punto en el mapa.";
  }
}
