import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Inicio from "./page";

describe("Página de bienvenida", () => {
  it("incluye el mapa de daños en un iframe", () => {
    render(<Inicio />);
    expect(screen.getByTitle("Mapa de daños reportados")).toHaveAttribute("src", "/mapa");
  });

  it("lleva al formulario de crear reporte", () => {
    render(<Inicio />);
    expect(screen.getByRole("link", { name: "Crear reporte" })).toHaveAttribute("href", "/reportes/nuevo");
  });
});
