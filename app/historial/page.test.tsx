import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
let busqueda = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/historial",
  useSearchParams: () => new URLSearchParams(busqueda),
}));

import HistorialPage from "./page";

function reporte(n: number) {
  return {
    id: `id-${n}`, categoria: "VIAL", tipo: "HUECO", descripcion: `Descripción ${n}`,
    idCoordenada: "c", urlImagen: null, nombreImagen: null, idUsuario: "u",
    nivelEmergencia: "ALTA", estado: "REPORTADO", fecha: "2026-10-06T21:15:42Z",
    idResponsable: null, motivoRechazo: null,
  };
}

function mockApi(elementos: unknown[], total: number, pagina = 1) {
  const fetchMock = vi.fn((url: string) => {
    if (url.includes("/catalogo")) return Promise.resolve(new Response("[]", { status: 200 }));
    const query = new URL(url, "http://x").searchParams;
    const unElemento = query.get("tamanoPagina") === "1";
    return Promise.resolve(
      new Response(
        JSON.stringify({
          elementos: unElemento ? [] : elementos, pagina, tamanoPagina: 20, totalElementos: total,
        }),
        { status: 200 }
      )
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  push.mockClear();
  busqueda = "";
});
afterEach(() => vi.unstubAllGlobals());

describe("/historial", () => {
  it("muestra la lista con el total", async () => {
    mockApi([reporte(1), reporte(2)], 45);
    render(<HistorialPage />);
    expect(await screen.findByText("Descripción 1")).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 3 · 45 reportes/)).toBeInTheDocument();
  });

  it("muestra el estado vacío", async () => {
    mockApi([], 0);
    render(<HistorialPage />);
    expect(await screen.findByText("No hay reportes con esos filtros.")).toBeInTheDocument();
  });

  it("muestra el error con reintento cuando falla el listado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) =>
        url.includes("tamanoPagina=20")
          ? Promise.resolve(new Response('{"message":"Servicio caído"}', { status: 503 }))
          : Promise.resolve(new Response("[]", { status: 200 }))
      )
    );
    render(<HistorialPage />);
    expect(await screen.findByText("Servicio caído")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });

  it("cambiar un filtro vuelve a la página 1 en la URL", async () => {
    busqueda = "pagina=3";
    mockApi([reporte(1)], 80, 3);
    render(<HistorialPage />);
    await screen.findByText("Descripción 1");
    await userEvent.selectOptions(screen.getByLabelText("Estado"), "RESUELTO");
    const destino = String(push.mock.calls.at(-1)?.[0]);
    expect(destino).toContain("estado=RESUELTO");
    expect(destino).not.toContain("pagina");
  });

  it("pasar de página actualiza la URL", async () => {
    mockApi([reporte(1)], 45);
    render(<HistorialPage />);
    await screen.findByText("Descripción 1");
    await userEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(String(push.mock.calls.at(-1)?.[0])).toContain("pagina=2");
  });

  it("pide la página y filtros que dice la URL", async () => {
    busqueda = "estado=ASIGNADO&nivel=ALTA&tipo=HUECOS_EN_LA_VIA&pagina=2";
    const fetchMock = mockApi([reporte(1)], 45, 2);
    render(<HistorialPage />);
    await waitFor(() => {
      const lista = fetchMock.mock.calls.map((c) => new URL(c[0], "http://x").searchParams)
        .find((q) => q.get("tamanoPagina") === "20");
      expect(lista?.get("estado")).toBe("ASIGNADO");
      expect(lista?.get("nivelEmergencia")).toBe("ALTA");
      expect(lista?.get("tipo")).toBe("HUECOS_EN_LA_VIA");
      expect(lista?.get("pagina")).toBe("2");
    });
  });
});
