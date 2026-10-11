import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import DetalleDano from "./DetalleDano";

const reporte = {
  id: "r1", categoria: "VIAL", tipo: "HUECO", descripcion: "Hueco grande en la vía",
  idCoordenada: "c1", urlImagen: null, nombreImagen: null, idUsuario: "u1",
  nivelEmergencia: "ALTA", estado: "EN_INTERVENCION", fecha: "2026-10-06T21:15:42Z",
  idResponsable: null, motivoRechazo: null,
};
const catalogo = [{ codigo: "VIAL", nombre: "Vías", tipos: [{ codigo: "HUECO", nombre: "Hueco en la vía" }] }];

function responder(...respuestas: Response[]) {
  const fetch = vi.fn();
  for (const r of respuestas) fetch.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const renderizar = () =>
  render(<DetalleDano reportId="r1" coordenada={{ lat: 4.6486, lon: -74.0628 }} catalogo={catalogo} />);

afterEach(() => vi.unstubAllGlobals());

describe("DetalleDano", () => {
  it("muestra el daño con los nombres del catálogo", async () => {
    const fetch = responder(new Response(JSON.stringify(reporte)));
    renderizar();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando daño...");

    expect(await screen.findByText("Hueco en la vía")).toBeInTheDocument();
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/reportes/r1");
    expect(screen.getByText("Vías")).toBeInTheDocument();
    expect(screen.getByText("Hueco grande en la vía")).toBeInTheDocument();
    expect(screen.getByText("En intervención")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("4.64860, -74.06280")).toBeInTheDocument();
  });

  it("muestra la imagen cuando el reporte la tiene", async () => {
    responder(new Response(JSON.stringify({ ...reporte, urlImagen: "http://img/x.jpg" })));
    renderizar();
    expect(await screen.findByRole("img")).toHaveAttribute("src", "http://img/x.jpg");
  });

  it("avisa cuando el punto no tiene reporte (404)", async () => {
    responder(new Response("", { status: 404 }));
    renderizar();
    expect(await screen.findByText("No hay un reporte registrado para este punto.")).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    responder(
      new Response(JSON.stringify({ message: "Servicio no disponible" }), { status: 503 }),
      new Response(JSON.stringify(reporte))
    );
    renderizar();
    expect(await screen.findByRole("alert")).toHaveTextContent("Servicio no disponible");

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Hueco en la vía")).toBeInTheDocument();
  });
});
