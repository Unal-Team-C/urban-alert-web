import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TotalesGrid from "./TotalesGrid";

function pagina(total: number) {
  return new Response(
    JSON.stringify({ elementos: [], pagina: 1, tamanoPagina: 1, totalElementos: total }),
    { status: 200 }
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("TotalesGrid", () => {
  it("muestra el total exacto de cada estado y nivel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const query = new URL(url, "http://x").searchParams;
        return Promise.resolve(pagina(query.get("estado") === "REPORTADO" ? 42 : 7));
      })
    );
    render(<TotalesGrid filtros={{}} onSeleccionar={() => {}} />);
    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(10); // 6 estados + 4 niveles
  });

  it("una tarjeta que falla muestra — y no rompe las demás", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        const query = new URL(url, "http://x").searchParams;
        return query.get("estado") === "ASIGNADO"
          ? Promise.resolve(new Response("{}", { status: 500 }))
          : Promise.resolve(pagina(5));
      })
    );
    render(<TotalesGrid filtros={{}} onSeleccionar={() => {}} />);
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument());
    expect(screen.getAllByText("5").length).toBe(9);
  });

  it("al hacer clic aplica el filtro; sobre la tarjeta activa lo quita", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(pagina(1))));
    const onSeleccionar = vi.fn();
    const { rerender } = render(<TotalesGrid filtros={{}} onSeleccionar={onSeleccionar} />);
    await userEvent.click(screen.getByRole("button", { name: /Resuelto/ }));
    expect(onSeleccionar).toHaveBeenLastCalledWith("estado", "RESUELTO");

    rerender(<TotalesGrid filtros={{ estado: "RESUELTO" }} onSeleccionar={onSeleccionar} />);
    await userEvent.click(screen.getByRole("button", { name: /Resuelto/ }));
    expect(onSeleccionar).toHaveBeenLastCalledWith("estado", "");
  });
});
