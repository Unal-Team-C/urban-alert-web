import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import LineaDeTiempo from "./LineaDeTiempo";

const usuarios = [{ id: "u1", name: "Ana Admin", email: "a@x.co", role: "ADMIN" as const }];

function evento(n: number, tipo = "reporte.creado") {
  return {
    sequence: n, eventId: `e${n}`, eventType: tipo, version: 1,
    occurredAt: "2026-10-06T21:15:42Z", actorId: "u1", correlationId: null,
    data: {}, previousHash: "p", hash: "h",
  };
}

function linea(items: ReturnType<typeof evento>[], nextCursor: string | null) {
  return new Response(JSON.stringify({ reportId: "r1", items, nextCursor }), { status: 200 });
}

afterEach(() => vi.unstubAllGlobals());

describe("LineaDeTiempo", () => {
  it("con un solo evento lo muestra con actor y sin botón de cargar más", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(linea([evento(1)], null)));
    render(<LineaDeTiempo idReporte="r1" usuarios={usuarios} />);
    expect(await screen.findByText("Reporte creado")).toBeInTheDocument();
    expect(screen.getByText(/Ana Admin/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cargar más/ })).not.toBeInTheDocument();
  });

  it("un tipo de evento desconocido se muestra tal cual", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(linea([evento(1, "reporte.asignado")], null)));
    render(<LineaDeTiempo idReporte="r1" usuarios={usuarios} />);
    expect(await screen.findByText("reporte.asignado")).toBeInTheDocument();
  });

  it("carga más con el cursor y agrega los eventos", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(linea([evento(1)], "1"))
      .mockResolvedValueOnce(linea([evento(2, "reporte.verificado")], null));
    vi.stubGlobal("fetch", fetchMock);
    render(<LineaDeTiempo idReporte="r1" usuarios={usuarios} />);
    await userEvent.click(await screen.findByRole("button", { name: /Cargar más/ }));
    expect(await screen.findByText("reporte.verificado")).toBeInTheDocument();
    expect(new URL(fetchMock.mock.calls[1][0], "http://x").searchParams.get("cursor")).toBe("1");
    expect(screen.getByText("Reporte creado")).toBeInTheDocument();
  });

  it("un 403 muestra un mensaje de acceso y permite reintentar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })));
    render(<LineaDeTiempo idReporte="r1" usuarios={usuarios} />);
    expect(await screen.findByText(/No tiene acceso/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
  });
});
