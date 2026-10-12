import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VolverAlMapa from "./VolverAlMapa";

afterEach(() => vi.unstubAllGlobals());

describe("VolverAlMapa", () => {
  it("lleva a la última vista del mapa", () => {
    vi.stubGlobal("localStorage", { getItem: () => "lat=4.63868&lon=-74.08289&zoom=13", setItem: () => {} });
    render(<VolverAlMapa texto="← Volver al inicio" />);
    expect(screen.getByRole("link", { name: "← Volver al inicio" })).toHaveAttribute(
      "href",
      "/?lat=4.63868&lon=-74.08289&zoom=13"
    );
  });

  it("sin vista guardada lleva a la página principal", () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
    render(<VolverAlMapa texto="← Volver al mapa" />);
    expect(screen.getByRole("link", { name: "← Volver al mapa" })).toHaveAttribute("href", "/");
  });
});
