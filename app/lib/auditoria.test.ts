import { afterEach, describe, expect, it, vi } from "vitest";
import { LIMITE_EVENTOS, obtenerLineaDeTiempo, verificarIntegridad } from "./auditoria";

function responder(cuerpo: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("auditoría", () => {
  it("pide la línea de tiempo con límite y sin cursor la primera vez", async () => {
    const fetchMock = responder({ reportId: "r", items: [], nextCursor: null });
    await obtenerLineaDeTiempo("r1");
    const url = new URL(fetchMock.mock.calls[0][0], "http://x");
    expect(url.pathname).toBe("/api/v1/auditoria/reportes/r1");
    expect(url.searchParams.get("limit")).toBe(String(LIMITE_EVENTOS));
    expect(url.searchParams.has("cursor")).toBe(false);
  });

  it("envía el cursor al cargar más", async () => {
    const fetchMock = responder({ reportId: "r", items: [], nextCursor: null });
    await obtenerLineaDeTiempo("r1", "50");
    expect(new URL(fetchMock.mock.calls[0][0], "http://x").searchParams.get("cursor")).toBe("50");
  });

  it("consulta la integridad del reporte", async () => {
    const fetchMock = responder({ verified: true });
    await verificarIntegridad("r1");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/auditoria/reportes/r1/integridad");
  });
});
