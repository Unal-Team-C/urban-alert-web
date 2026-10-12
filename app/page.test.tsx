import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("") }));

import Inicio from "./page";

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]"))));
afterEach(() => vi.unstubAllGlobals());

describe("página principal", () => {
  it("muestra la barra con el logo y el acceso a crear un reporte", () => {
    render(<Inicio />);
    expect(screen.getByRole("link", { name: "UrbanAlert, ir al mapa" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Crear reporte" })).toHaveAttribute("href", "/reportes/nuevo");
  });

  it("lleva al histórico desde la barra superior", () => {
    render(<Inicio />);
    expect(screen.getByRole("link", { name: "Histórico" })).toHaveAttribute("href", "/historial");
  });

  it("muestra el mapa directamente, sin iframe", () => {
    const { container } = render(<Inicio />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("no abre ningún panel de detalle hasta pulsar un punto", () => {
    render(<Inicio />);
    expect(screen.queryByRole("complementary", { name: "Detalle del daño" })).toBeNull();
  });
});
