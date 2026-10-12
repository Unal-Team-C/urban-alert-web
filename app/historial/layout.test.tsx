import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HistorialLayout from "./layout";

afterEach(() => vi.unstubAllGlobals());

describe("layout del histórico", () => {
  it("muestra la barra con Volver al inicio en el histórico y en el detalle", () => {
    vi.stubGlobal("localStorage", { getItem: () => "lat=4.63868&lon=-74.08289&zoom=12", setItem: () => {} });
    render(
      <HistorialLayout>
        <p>contenido</p>
      </HistorialLayout>
    );
    expect(screen.getByRole("banner")).toContainElement(screen.getByRole("link", { name: "← Volver al inicio" }));
    expect(screen.getByRole("link", { name: "← Volver al inicio" })).toHaveAttribute(
      "href",
      "/?lat=4.63868&lon=-74.08289&zoom=12"
    );
    expect(screen.getByText("contenido")).toBeInTheDocument();
  });
});
