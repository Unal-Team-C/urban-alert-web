import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReporteCreadoModal from "./ReporteCreadoModal";

afterEach(() => vi.unstubAllGlobals());

describe("ReporteCreadoModal", () => {
  it("ofrece volver a la última vista del mapa", () => {
    vi.stubGlobal("localStorage", { getItem: () => "lat=4.70000&lon=-74.07000&zoom=14", setItem: () => {} });
    render(<ReporteCreadoModal idReporte="r1" onClose={() => {}} />);
    expect(screen.getByRole("link", { name: "Volver al mapa" })).toHaveAttribute(
      "href",
      "/?lat=4.70000&lon=-74.07000&zoom=14"
    );
  });

  it("se sigue cerrando con Aceptar para crear otro reporte", async () => {
    vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => {} });
    const onClose = vi.fn();
    render(<ReporteCreadoModal idReporte="r1" onClose={onClose} />);
    expect(screen.getByRole("button", { name: "Aceptar" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(onClose).toHaveBeenCalled();
  });
});
