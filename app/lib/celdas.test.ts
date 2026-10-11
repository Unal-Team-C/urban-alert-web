import { describe, expect, it } from "vitest";
import { LADO_BASE, RADIO_MAXIMO, ancestros, celdasVisibles, enCelda, ladoParaZoom } from "./celdas";
import { LIMITES_BOGOTA, dentroDeBogota } from "./ubicacion";

// Vista de ~50 × 30 km sobre la zona urbana (zoom 12 en una pantalla grande).
const CIUDAD = { latMin: 4.45, latMax: 4.8, lonMin: -74.25, lonMax: -73.98 };

// Rejilla pseudoaleatoria determinista de puntos dentro de un rectángulo.
function puntosEn(l: typeof CIUDAD, n: number) {
  const puntos = [];
  let semilla = 7;
  const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  for (let k = 0; k < n; k++) {
    puntos.push({ lat: l.latMin + azar() * (l.latMax - l.latMin), lon: l.lonMin + azar() * (l.lonMax - l.lonMin) });
  }
  return puntos;
}

describe("ladoParaZoom", () => {
  it("usa el lado base hasta el zoom 14 y lo divide a la mitad por nivel después", () => {
    expect([12, 13, 14, 15, 16, 17, 18].map(ladoParaZoom)).toEqual([8000, 8000, 8000, 4000, 2000, 1000, 500]);
  });
});

describe("celdasVisibles", () => {
  it.each([12, 13, 14, 15, 16, 17, 18])("en zoom %i los centros están en Bogotá y el radio ≤ 6000 m", (zoom) => {
    const vista = zoom <= 13 ? CIUDAD : { latMin: 4.6, latMax: 4.62, lonMin: -74.09, lonMax: -74.06 };
    const celdas = celdasVisibles(vista, zoom);
    expect(celdas.length).toBeGreaterThan(0);
    for (const c of celdas) {
      expect(dentroDeBogota(c.centro)).toBe(true);
      expect(c.radio).toBeGreaterThan(0);
      expect(c.radio).toBeLessThanOrEqual(RADIO_MAXIMO);
    }
  });

  it("cada punto de la vista cae en exactamente una celda", () => {
    const celdas = celdasVisibles(CIUDAD, 12);
    for (const punto of puntosEn(CIUDAD, 2000)) {
      expect(celdas.filter((c) => enCelda(c, punto))).toHaveLength(1);
    }
  });

  it("los puntos en el borde exterior de Bogotá también tienen celda", () => {
    const b = LIMITES_BOGOTA;
    const celdas = celdasVisibles(b, 12);
    for (const punto of [
      { lat: b.latMax, lon: b.lonMax },
      { lat: b.latMin, lon: b.lonMin },
      { lat: b.latMax, lon: b.lonMin },
    ]) {
      expect(celdas.filter((c) => enCelda(c, punto))).toHaveLength(1);
    }
  });

  it("el círculo de cada celda cubre todo su cuadrado", () => {
    for (const c of celdasVisibles(CIUDAD, 12)) {
      const { latMin, latMax, lonMin, lonMax } = c.limites;
      const alto = (latMax - latMin) * 111_320;
      const ancho = (lonMax - lonMin) * 111_320 * Math.cos((c.centro.lat * Math.PI) / 180);
      expect(c.radio).toBeGreaterThanOrEqual(Math.hypot(alto, ancho) / 2);
    }
  });

  it("no devuelve celdas para una vista fuera de Bogotá", () => {
    expect(celdasVisibles({ latMin: 5, latMax: 5.1, lonMin: -74.1, lonMax: -74 }, 13)).toEqual([]);
  });

  it("las claves no dependen de la vista: al desplazar se reutilizan", () => {
    const a = celdasVisibles({ latMin: 4.6, latMax: 4.7, lonMin: -74.15, lonMax: -74.05 }, 13).map((c) => c.clave);
    const b = celdasVisibles({ latMin: 4.62, latMax: 4.72, lonMin: -74.13, lonMax: -74.03 }, 13).map((c) => c.clave);
    expect(a.filter((clave) => b.includes(clave)).length).toBeGreaterThan(0);
  });
});

describe("ancestros", () => {
  it("cada ancestro contiene a la celda, hasta el lado base", () => {
    const [celda] = celdasVisibles({ latMin: 4.65, latMax: 4.651, lonMin: -74.06, lonMax: -74.059 }, 18);
    const lista = ancestros(celda);
    expect(lista.map((c) => c.lado)).toEqual([1000, 2000, 4000, LADO_BASE]);
    for (const punto of puntosEn(celda.limites, 200)) {
      for (const ancestro of lista) expect(enCelda(ancestro, punto)).toBe(true);
    }
  });

  it("una celda del lado base no tiene ancestros", () => {
    expect(ancestros(celdasVisibles(CIUDAD, 12)[0])).toEqual([]);
  });
});
