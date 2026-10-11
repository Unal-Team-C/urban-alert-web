import { act, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DetalleReportePage from "./page";

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

// `use(params)` suspende: el render se espera dentro de un act asíncrono.
async function renderizar() {
  const params = Promise.resolve({ id: "r1" });
  await act(async () => {
    render(
      <Suspense fallback="espera">
        <DetalleReportePage params={params} searchParams={Promise.resolve({})} />
      </Suspense>
    );
  });
}

afterEach(() => vi.unstubAllGlobals());

describe("/historial/[id]", () => {
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
