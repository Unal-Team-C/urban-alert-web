import { describe, expect, it, vi } from "vitest";

// next/font solo funciona con el compilador de Next.
vi.mock("next/font/google", () => ({ Geist: () => ({ variable: "geist" }), Geist_Mono: () => ({ variable: "geist-mono" }) }));

import { metadata as raiz } from "./layout";
import { metadata as historial } from "./historial/layout";
import { metadata as detalle } from "./historial/detalle/layout";
import { metadata as mapa } from "./mapa/layout";
import { metadata as nuevo } from "./reportes/nuevo/layout";

describe("identidad del sitio (spec 003)", () => {
  it("el título por defecto es UrbanAlert y las secciones añaden « · UrbanAlert»", () => {
    expect(raiz.title).toEqual({ default: "UrbanAlert", template: "%s · UrbanAlert" });
  });

  it("describe el sitio sin texto de la plantilla de Next.js", () => {
    expect(raiz.description).toBe("Reporte y seguimiento de daños urbanos en Bogotá");
    expect(JSON.stringify(raiz)).not.toMatch(/create next app/i);
  });

  it("cada sección tiene su título", () => {
    expect(nuevo.title).toBe("Crear reporte");
    expect(historial.title).toEqual({ default: "Histórico de reportes", template: "%s · UrbanAlert" });
    expect(detalle.title).toBe("Detalle del reporte");
    expect(mapa.title).toBe("Mapa de daños");
  });
});
