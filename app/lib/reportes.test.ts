import { afterEach, describe, expect, it, vi } from "vitest";
import { contarPor, listarReportes, TAMANO_PAGINA } from "./reportes";

function responder(cuerpo: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("listarReportes", () => {
  it("envía filtros, página y tamaño; omite los filtros vacíos", async () => {
    const fetchMock = responder({ elementos: [], pagina: 2, tamanoPagina: 20, totalElementos: 0 });
    await listarReportes({ estado: "EN_INTERVENCION", nivelEmergencia: "" }, 2);
    const url = new URL(fetchMock.mock.calls[0][0], "http://x");
    expect(url.pathname).toBe("/api/v1/reportes");
    expect(url.searchParams.get("estado")).toBe("EN_INTERVENCION");
    expect(url.searchParams.has("nivelEmergencia")).toBe(false);
    expect(url.searchParams.get("pagina")).toBe("2");
    expect(url.searchParams.get("tamanoPagina")).toBe(String(TAMANO_PAGINA));
  });
});

describe("contarPor", () => {
  it("pide una página de 1 elemento y devuelve totalElementos", async () => {
    const fetchMock = responder({ elementos: [], pagina: 1, tamanoPagina: 1, totalElementos: 42 });
    expect(await contarPor("estado", "REPORTADO")).toBe(42);
    const url = new URL(fetchMock.mock.calls[0][0], "http://x");
    expect(url.searchParams.get("estado")).toBe("REPORTADO");
    expect(url.searchParams.get("tamanoPagina")).toBe("1");
  });
});
