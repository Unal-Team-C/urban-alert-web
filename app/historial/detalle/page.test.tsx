import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DetalleReportePage from "./page";

// La página lee el id de la query (?id=); cada prueba fija la query que «tiene» la URL.
let query = "id=r1";
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(query) }));

const reporte = {
  id: "r1", categoria: "VIAL", tipo: "HUECO", descripcion: "Hueco grande en la vía",
  idCoordenada: "c1", urlImagen: null, nombreImagen: null, idUsuario: "u1",
  nivelEmergencia: "ALTA", estado: "REPORTADO", fecha: "2026-10-06T21:15:42Z",
  idResponsable: null, motivoRechazo: null,
};

function json(cuerpo: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(cuerpo), { status }));
}

function mockApi(rutas: Record<string, () => Promise<Response>>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const ruta = Object.keys(rutas).find((r) => url.includes(r));
      return ruta ? rutas[ruta]() : json({}, 500);
    })
  );
}

async function renderizar(consulta = "id=r1") {
  query = consulta;
  await act(async () => {
    render(<DetalleReportePage />);
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("/historial/detalle/?id=", () => {
  it("sin id en la URL muestra 'Reporte no encontrado' sin llamar a la API", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await renderizar("");
    expect(await screen.findByText("Reporte no encontrado.")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining("/api/v1/reportes/"), expect.anything());
  });

  it("pide a Reportes el id de la URL", async () => {
    mockApi({ "/api/v1/reportes/abc-123": () => json({}, 404) });
    await renderizar("id=abc-123");
    expect(await screen.findByText("Reporte no encontrado.")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/v1/reportes/abc-123", expect.anything());
  });

  it("muestra 'Reporte no encontrado' ante un 404", async () => {
    mockApi({ "/api/v1/reportes/r1": () => json({}, 404) });
    await renderizar();
    expect(await screen.findByText("Reporte no encontrado.")).toBeInTheDocument();
  });

  it("si Auditoría y Geoespacial fallan, el detalle sigue visible", async () => {
    mockApi({
      "/api/v1/reportes/r1": () => json(reporte),
      "/api/v1/reportes/catalogo": () => json([]),
      "/api/v1/usuarios": () => json([{ id: "u1", name: "Ana", email: "a@x.co", role: "USER" }]),
      "/api/v1/geoespacial": () => json({}, 500),
      "/api/v1/auditoria/reportes/r1/integridad": () => json({}, 500),
      "/api/v1/auditoria": () => json({}, 403),
    });
    await renderizar();
    expect(await screen.findByText("Hueco grande en la vía")).toBeInTheDocument();
    expect(await screen.findByText("No disponible")).toBeInTheDocument();
    expect(await screen.findByText(/No tiene acceso/)).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("muestra la ubicación cuando Geoespacial responde", async () => {
    mockApi({
      "/api/v1/reportes/r1": () => json(reporte),
      "/api/v1/reportes/catalogo": () => json([]),
      "/api/v1/usuarios": () => json([]),
      "/api/v1/geoespacial": () =>
        json({ coordinateId: "c1", reportId: "r1", coordinate: { lat: 4.6097, lon: -74.0817 } }),
      "/api/v1/auditoria": () => json({ reportId: "r1", items: [], nextCursor: null }),
    });
    await renderizar();
    expect(await screen.findByText("4.60970, -74.08170")).toBeInTheDocument();
  });
});
