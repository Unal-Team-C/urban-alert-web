import { describe, expect, it } from "vitest";
import { formatearFecha, idCorto } from "./formato";

describe("formatearFecha", () => {
  it("muestra la hora de Bogotá (UTC-5)", () => {
    expect(formatearFecha("2026-10-06T21:15:42Z")).toMatch(/4:15/);
  });

  it("devuelve el texto original si la fecha es inválida", () => {
    expect(formatearFecha("no-es-fecha")).toBe("no-es-fecha");
  });
});

describe("idCorto", () => {
  it("toma los primeros 8 caracteres", () => {
    expect(idCorto("018f4c2a-0000-7000-8000-000000000001")).toBe("018f4c2a");
  });
});
