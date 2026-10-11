import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CategoriaCatalogo } from "../../lib/catalogo";
import FiltrosHistorial from "./FiltrosHistorial";

const catalogo: CategoriaCatalogo[] = [
  {
    codigo: "VIAS_Y_ANDENES",
    nombre: "Vías y andenes",
    tipos: [
      { codigo: "HUECOS_EN_LA_VIA", nombre: "Huecos en la vía" },
      { codigo: "ANDEN_ROTO", nombre: "Andén roto" },
    ],
  },
  {
    codigo: "SENALIZACION",
    nombre: "Señalización",
    tipos: [{ codigo: "SEMAFORO_APAGADO", nombre: "Semáforo apagado" }],
  },
];

describe("FiltrosHistorial", () => {
  it("agrupa los tipos por categoría", () => {
    render(<FiltrosHistorial filtros={{}} catalogo={catalogo} onCambiar={() => {}} />);
    const grupos = within(screen.getByLabelText("Tipo")).getAllByRole("group");
    expect(grupos.map((g) => g.getAttribute("label"))).toEqual(["Vías y andenes", "Señalización"]);
    expect(within(grupos[0]).getAllByRole("option")).toHaveLength(2);
  });

  it("al elegir un tipo avisa con su código", async () => {
    const onCambiar = vi.fn();
    render(<FiltrosHistorial filtros={{}} catalogo={catalogo} onCambiar={onCambiar} />);
    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "SEMAFORO_APAGADO");
    expect(onCambiar).toHaveBeenCalledWith("tipo", "SEMAFORO_APAGADO");
  });

  it("refleja el tipo activo y 'Todos' lo quita", async () => {
    const onCambiar = vi.fn();
    render(
      <FiltrosHistorial filtros={{ tipo: "ANDEN_ROTO" }} catalogo={catalogo} onCambiar={onCambiar} />
    );
    expect(screen.getByLabelText("Tipo")).toHaveValue("ANDEN_ROTO");
    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "");
    expect(onCambiar).toHaveBeenCalledWith("tipo", "");
  });

  it("sin catálogo el selector solo ofrece 'Todos'", () => {
    render(<FiltrosHistorial filtros={{}} catalogo={[]} onCambiar={() => {}} />);
    expect(within(screen.getByLabelText("Tipo")).getAllByRole("option")).toHaveLength(1);
  });
});
