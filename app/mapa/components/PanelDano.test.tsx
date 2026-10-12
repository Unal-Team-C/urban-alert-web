import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PanelDano from "./PanelDano";

const reporte = {
  id: "r1", categoria: "VIAL", tipo: "HUECO", descripcion: "Hueco grande en la vía",
  idCoordenada: "c1", urlImagen: null, nombreImagen: null, idUsuario: "u1",
  nivelEmergencia: "ALTA", estado: "EN_INTERVENCION", fecha: "2026-10-06T21:15:42Z",
  idResponsable: null, motivoRechazo: null,
};
const catalogo = [{ codigo: "VIAL", nombre: "Vías", tipos: [{ codigo: "HUECO", nombre: "Hueco en la vía" }] }];
const usuarios = [{ id: "u1", name: "Ana Gómez", email: "ana@x.co", role: "USER" as const }];

function responder(...respuestas: Response[]) {
  const fetch = vi.fn();
  for (const r of respuestas) fetch.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function renderizar(props: Partial<React.ComponentProps<typeof PanelDano>> = {}) {
  const onCerrar = vi.fn();
  render(
    <PanelDano
      reportId="r1"
      coordenada={{ lat: 4.6486, lon: -74.0628 }}
      catalogo={catalogo}
      usuarios={usuarios}
      onCerrar={onCerrar}
      {...props}
    />
  );
  return onCerrar;
}

afterEach(() => vi.unstubAllGlobals());

describe("PanelDano", () => {
  it("muestra el daño completo con quien lo reportó", async () => {
    const fetch = responder(new Response(JSON.stringify(reporte)));
    renderizar();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando daño...");

    expect(await screen.findByRole("heading", { name: "Hueco en la vía" })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/reportes/r1");
    expect(screen.getByText(/Vías · Reportado por/)).toBeInTheDocument();
    expect(screen.getByText("Ana Gómez")).toBeInTheDocument();
    expect(screen.getByText("Hueco grande en la vía")).toBeInTheDocument();
    expect(screen.getByText("En intervención")).toBeInTheDocument();
    expect(screen.getByText("Alta")).toBeInTheDocument();
    expect(screen.getByText("4.64860, -74.06280")).toBeInTheDocument();
  });

  it("enlaza a la ficha del reporte en el histórico", async () => {
    responder(new Response(JSON.stringify(reporte)));
    renderizar();
    expect(await screen.findByRole("link", { name: /Ver en el histórico/ })).toHaveAttribute(
      "href",
      "/historial/detalle?id=r1"
    );
  });

  it("muestra el inicio del id si no conoce al usuario", async () => {
    responder(new Response(JSON.stringify({ ...reporte, idUsuario: "018f4c2a-0000-7000" })));
    renderizar({ usuarios: [] });
    expect(await screen.findByText("018f4c2a")).toBeInTheDocument();
  });

  it("muestra la imagen cuando el reporte la tiene", async () => {
    responder(new Response(JSON.stringify({ ...reporte, urlImagen: "http://img/x.jpg" })));
    renderizar();
    expect(await screen.findByRole("img", { name: "Imagen del reporte" })).toHaveAttribute("src", "http://img/x.jpg");
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
    expect(await screen.findByRole("heading", { name: "Hueco en la vía" })).toBeInTheDocument();
  });

  it("se cierra con el botón y con Esc", async () => {
    responder(new Response(JSON.stringify(reporte)));
    const onCerrar = renderizar();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar detalle" }));
    await userEvent.keyboard("{Escape}");
    expect(onCerrar).toHaveBeenCalledTimes(2);
  });

  it("es una región con título que recibe el foco al abrirse", () => {
    responder(new Response(JSON.stringify(reporte)));
    renderizar();
    const region = screen.getByRole("complementary", { name: "Detalle del daño" });
    expect(region).toHaveFocus();
  });
});
