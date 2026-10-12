import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BarraSuperior from "./BarraSuperior";

describe("BarraSuperior", () => {
  it("muestra el logo enlazado a la página principal", () => {
    render(<BarraSuperior />);
    const enlace = screen.getByRole("link", { name: "UrbanAlert, ir al mapa" });
    expect(enlace).toHaveAttribute("href", "/");
    expect(screen.getByAltText("UrbanAlert")).toHaveAttribute("src", "/logo-urbanalert.png");
  });

  it("pone las acciones de la pantalla en el otro extremo", () => {
    render(
      <BarraSuperior>
        <a href="/reportes/nuevo">Crear reporte</a>
      </BarraSuperior>
    );
    const accion = screen.getByRole("link", { name: "Crear reporte" });
    expect(accion.parentElement).toBe(screen.getByRole("banner").lastElementChild);
  });
});
