import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CategoriaCatalogo } from "../../lib/catalogo";
import TotalesPorTipo from "./TotalesPorTipo";

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

function pagina(total: number) {
  return new Response(
    JSON.stringify({ elementos: [], pagina: 1, tamanoPagina: 1, totalElementos: total }),
    { status: 200 }
  );
}

afterEach(() => vi.unstubAllGlobals());

async function abrirPanel() {
  await userEvent.click(screen.getByRole("button", { name: /Por tipo de reporte/ }));
}

describe("TotalesPorTipo", () => {
  it("no pide nada hasta que se expande una categoría", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={() => {}} />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Por tipo de reporte/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: /Vías y andenes/ })).not.toBeInTheDocument();
  });

  it("al abrir el panel muestra las categorías plegadas y sigue sin pedir nada", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={() => {}} />);
    await abrirPanel();
    expect(screen.getByRole("button", { name: /Vías y andenes/ })).toHaveAttribute("aria-expanded", "false");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("al expandir pide solo los tipos de esa categoría y muestra los totales exactos", async () => {
    const fetchMock = vi.fn((url: string) => {
      const tipo = new URL(url, "http://x").searchParams.get("tipo");
      return Promise.resolve(pagina(tipo === "HUECOS_EN_LA_VIA" ? 12 : 3));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={() => {}} />);
    await abrirPanel();
    await userEvent.click(screen.getByRole("button", { name: /Vías y andenes/ }));
    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const tipos = fetchMock.mock.calls.map((c) => new URL(c[0], "http://x").searchParams.get("tipo"));
    expect(tipos.sort()).toEqual(["ANDEN_ROTO", "HUECOS_EN_LA_VIA"]);
  });

  it("al plegar y volver a expandir no repite las peticiones", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(pagina(1)));
    vi.stubGlobal("fetch", fetchMock);
    render(<TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={() => {}} />);
    await abrirPanel();
    const boton = screen.getByRole("button", { name: /Señalización/ });
    await userEvent.click(boton);
    await waitFor(() => expect(screen.getByText("1")).toBeInTheDocument());
    await userEvent.click(boton);
    await userEvent.click(boton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("un tipo que falla muestra — sin romper los demás", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        new URL(url, "http://x").searchParams.get("tipo") === "ANDEN_ROTO"
          ? Promise.resolve(new Response("{}", { status: 500 }))
          : Promise.resolve(pagina(5))
      )
    );
    render(<TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={() => {}} />);
    await abrirPanel();
    await userEvent.click(screen.getByRole("button", { name: /Vías y andenes/ }));
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument());
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("al hacer clic en un tipo aplica el filtro; sobre el activo lo quita", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(pagina(1))));
    const onSeleccionar = vi.fn();
    const { rerender } = render(
      <TotalesPorTipo catalogo={catalogo} filtros={{}} onSeleccionar={onSeleccionar} />
    );
    await abrirPanel();
    await userEvent.click(screen.getByRole("button", { name: /Señalización/ }));
    await userEvent.click(screen.getByRole("button", { name: /Semáforo apagado/ }));
    expect(onSeleccionar).toHaveBeenLastCalledWith("tipo", "SEMAFORO_APAGADO");

    rerender(
      <TotalesPorTipo catalogo={catalogo} filtros={{ tipo: "SEMAFORO_APAGADO" }} onSeleccionar={onSeleccionar} />
    );
    await userEvent.click(screen.getByRole("button", { name: /Semáforo apagado/ }));
    expect(onSeleccionar).toHaveBeenLastCalledWith("tipo", "");
  });

  it("sin catálogo no muestra la sección", () => {
    const { container } = render(<TotalesPorTipo catalogo={[]} filtros={{}} onSeleccionar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
