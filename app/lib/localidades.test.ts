import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cargarLocalidades,
  codigoLocalidad,
  contarPorLocalidad,
  dentroDeLocalidad,
  desdeGeoJson,
  seIntersecan,
} from "./localidades";

// Cuadrado de 0..10 con un hueco 4..6, en [lon, lat].
const CUADRADO = desdeGeoJson([
  {
    properties: {
      codigo: "99",
      nombre: "Prueba",
      etiqueta: [2, 2],
      limites: { latMin: 0, latMax: 10, lonMin: 0, lonMax: 10 },
    },
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [
          [[0, 0], [0, 10], [10, 10], [10, 0], [0, 0]],
          [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]],
        ],
      ],
    },
  },
]);

// vitest corre desde la raíz del proyecto.
const real = JSON.parse(readFileSync("public/localidades.geojson", "utf-8"));
const LOCALIDADES = desdeGeoJson(real.features);

afterEach(() => vi.unstubAllGlobals());

describe("dentroDeLocalidad", () => {
  const [cuadrado] = CUADRADO;

  it("acepta puntos interiores y rechaza los de afuera y los del hueco", () => {
    expect(dentroDeLocalidad(cuadrado, { lat: 2, lon: 2 })).toBe(true);
    expect(dentroDeLocalidad(cuadrado, { lat: 5, lon: 5 })).toBe(false);
    expect(dentroDeLocalidad(cuadrado, { lat: 11, lon: 5 })).toBe(false);
  });

  it("convierte [lon, lat] a [lat, lon] para dibujar", () => {
    expect(cuadrado.poligonos[0][0][1]).toEqual([10, 0]);
    expect(cuadrado.etiqueta).toEqual({ lat: 2, lon: 2 });
  });
});

describe("localidades reales (public/localidades.geojson)", () => {
  it("tiene las 20 localidades y cada etiqueta cae en la suya", () => {
    expect(LOCALIDADES).toHaveLength(20);
    for (const l of LOCALIDADES) expect(dentroDeLocalidad(l, l.etiqueta)).toBe(true);
  });

  it.each([
    [{ lat: 4.5981, lon: -74.0761 }, "La Candelaria"], // Plaza de Bolívar
    [{ lat: 4.6767, lon: -74.0483 }, "Chapinero"], // Parque de la 93
    [{ lat: 4.6947, lon: -74.0309 }, "Usaquén"], // Usaquén
    [{ lat: 4.7016, lon: -74.1469 }, "Fontibón"], // Aeropuerto El Dorado
    [{ lat: 4.6280, lon: -74.1530 }, "Kennedy"],
  ])("ubica %o en %s", (punto, nombre) => {
    const codigo = codigoLocalidad(LOCALIDADES, punto);
    expect(LOCALIDADES.find((l) => l.codigo === codigo)?.nombre).toBe(nombre);
  });

  it("un punto de Soacha no pertenece a ninguna localidad", () => {
    expect(codigoLocalidad(LOCALIDADES, { lat: 4.5794, lon: -74.2168 })).toBeNull();
  });
});

describe("contarPorLocalidad", () => {
  it("cuenta por localidad e ignora los puntos fuera de todas", () => {
    const totales = contarPorLocalidad(CUADRADO, [
      { lat: 1, lon: 1 },
      { lat: 3, lon: 8 },
      { lat: 5, lon: 5 },
      { lat: 20, lon: 20 },
    ]);
    expect([...totales]).toEqual([["99", 2]]);
  });
});

describe("codigoLocalidad con listas distintas", () => {
  it("un punto evaluado con una lista parcial se asigna bien con la lista completa", () => {
    const punto = { lat: 4.6280, lon: -74.1530 }; // Kennedy
    const sinKennedy = LOCALIDADES.filter((l) => l.nombre !== "Kennedy");
    expect(codigoLocalidad(sinKennedy, punto)).toBeNull();
    expect(LOCALIDADES.find((l) => l.codigo === codigoLocalidad(LOCALIDADES, punto))?.nombre).toBe("Kennedy");
    expect(contarPorLocalidad(LOCALIDADES, [punto]).get("08")).toBe(1);
  });
});

describe("seIntersecan", () => {
  it("detecta solapamiento y bordes compartidos", () => {
    const a = { latMin: 0, latMax: 1, lonMin: 0, lonMax: 1 };
    expect(seIntersecan(a, { latMin: 0.5, latMax: 2, lonMin: 0.5, lonMax: 2 })).toBe(true);
    expect(seIntersecan(a, { latMin: 1, latMax: 2, lonMin: 0, lonMax: 1 })).toBe(true);
    expect(seIntersecan(a, { latMin: 1.1, latMax: 2, lonMin: 0, lonMax: 1 })).toBe(false);
  });
});

describe("cargarLocalidades", () => {
  it("pide el GeoJSON del mismo origen", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(real)));
    vi.stubGlobal("fetch", fetch);
    expect(await cargarLocalidades()).toHaveLength(20);
    expect(fetch.mock.calls[0][0]).toBe("/localidades.geojson");
  });
});
