import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NuevoReporte from "./page";

// Almacenamiento en memoria (Node 25+ tapa el localStorage de jsdom, ver app/lib/vistaMapa.test.ts).
function almacenamiento(valores: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const datos = new Map(Object.entries(valores));
  return { getItem: (c) => datos.get(c) ?? null, setItem: (c, v) => void datos.set(c, v) };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]"))));
afterEach(() => vi.unstubAllGlobals());

describe("formulario de nuevo reporte: volver al mapa", () => {
  it("vuelve a la última vista del mapa", async () => {
    vi.stubGlobal("localStorage", almacenamiento({ "urbanalert.vistaMapa": "lat=4.67719&lon=-74.07171&zoom=16" }));
    render(<NuevoReporte />);
    expect(await screen.findByRole("link", { name: "← Volver al mapa" })).toHaveAttribute(
      "href",
      "/?lat=4.67719&lon=-74.07171&zoom=16"
    );
  });

  it("sin vista guardada vuelve a la página principal", async () => {
    vi.stubGlobal("localStorage", almacenamiento());
    render(<NuevoReporte />);
    expect(await screen.findByRole("link", { name: "← Volver al mapa" })).toHaveAttribute("href", "/");
  });

  it("mantiene el logo y el selector de usuario en la barra", async () => {
    vi.stubGlobal("localStorage", almacenamiento());
    render(<NuevoReporte />);
    const barra = screen.getByRole("banner");
    expect(barra).toContainElement(screen.getByRole("link", { name: "UrbanAlert, ir al mapa" }));
    expect(barra).toContainElement(screen.getByTitle("Cambiar o agregar usuario"));
  });
});
