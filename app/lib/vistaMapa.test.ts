import { describe, expect, it } from "vitest";
import { VISTA_INICIAL, escribirVista, leerVista } from "./vistaMapa";

const leer = (query: string) => leerVista(new URLSearchParams(query));

describe("leerVista", () => {
  it("lee una vista válida", () => {
    expect(leer("lat=4.65&lon=-74.06&zoom=16")).toEqual({ lat: 4.65, lon: -74.06, zoom: 16 });
  });

  it("usa la vista inicial si falta o es inválido el centro", () => {
    expect(leer("")).toEqual(VISTA_INICIAL);
    expect(leer("lat=abc&lon=-74.06")).toEqual(VISTA_INICIAL);
    expect(leer("lat=&lon=-74.06")).toEqual(VISTA_INICIAL);
  });

  it("usa la vista inicial si el centro está fuera de Bogotá", () => {
    expect(leer("lat=6.25&lon=-75.56&zoom=14")).toEqual(VISTA_INICIAL);
  });

  it("limita y redondea el zoom", () => {
    expect(leer("lat=4.65&lon=-74.06&zoom=3").zoom).toBe(12);
    expect(leer("lat=4.65&lon=-74.06&zoom=25").zoom).toBe(18);
    expect(leer("lat=4.65&lon=-74.06&zoom=14.6").zoom).toBe(15);
    expect(leer("lat=4.65&lon=-74.06").zoom).toBe(12);
  });
});

describe("escribirVista", () => {
  it("escribe 5 decimales y se puede volver a leer", () => {
    const query = escribirVista({ lat: 4.6512345, lon: -74.0561234, zoom: 15 });
    expect(query).toBe("lat=4.65123&lon=-74.05612&zoom=15");
    expect(leer(query)).toEqual({ lat: 4.65123, lon: -74.05612, zoom: 15 });
  });
});
