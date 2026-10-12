import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VISTA_INICIAL, escribirVista, guardarUltimaVista, hrefUltimaVista, leerVista } from "./vistaMapa";

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

// Almacenamiento en memoria: Node 25+ trae su propio localStorage global (vacío sin --localstorage-file)
// que tapa al de jsdom, así que las pruebas no dependen de la versión de Node.
function almacenamientoEnMemoria(): Storage {
  const datos = new Map<string, string>();
  return {
    get length() {
      return datos.size;
    },
    clear: () => datos.clear(),
    getItem: (clave) => datos.get(clave) ?? null,
    key: (i) => [...datos.keys()][i] ?? null,
    removeItem: (clave) => void datos.delete(clave),
    setItem: (clave, valor) => void datos.set(clave, String(valor)),
  };
}

describe("última vista del mapa", () => {
  beforeEach(() => vi.stubGlobal("localStorage", almacenamientoEnMemoria()));
  afterEach(() => vi.unstubAllGlobals());

  it("sin vista guardada vuelve a la página principal", () => {
    expect(hrefUltimaVista()).toBe("/");
  });

  it("vuelve a la última vista guardada", () => {
    guardarUltimaVista({ lat: 4.677191, lon: -74.071712, zoom: 16 });
    expect(hrefUltimaVista()).toBe("/?lat=4.67719&lon=-74.07171&zoom=16");
  });

  it("ignora una vista guardada inválida o fuera de Bogotá", () => {
    localStorage.setItem("urbanalert.vistaMapa", "lat=40&lon=-3&zoom=10");
    expect(hrefUltimaVista()).toBe("/");
    localStorage.setItem("urbanalert.vistaMapa", "basura");
    expect(hrefUltimaVista()).toBe("/");
  });

  it("funciona sin almacenamiento disponible", () => {
    const bloqueado = () => {
      throw new Error("bloqueado");
    };
    vi.stubGlobal("localStorage", { ...almacenamientoEnMemoria(), getItem: bloqueado, setItem: bloqueado });
    expect(() => guardarUltimaVista({ lat: 4.7, lon: -74.07, zoom: 14 })).not.toThrow();
    expect(hrefUltimaVista()).toBe("/");
  });
});
