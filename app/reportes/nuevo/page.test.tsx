import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NuevoReporte from "./page";

// Almacenamiento en memoria (Node 25+ tapa el localStorage de jsdom, ver app/lib/vistaMapa.test.ts).
function almacenamiento(valores: Record<string, string> = {}): Pick<Storage, "getItem" | "setItem"> {
  const datos = new Map(Object.entries(valores));
  return { getItem: (c) => datos.get(c) ?? null, setItem: (c, v) => void datos.set(c, v) };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]"))));
afterEach(() => vi.unstubAllGlobals());

describe("formulario de nuevo reporte: volver al mapa", () => {
  it("vuelve a la última vista del mapa", async () => {
    vi.stubGlobal("localStorage", almacenamiento({ "urbanalert.vistaMapa": "lat=4.67719&lon=-74.07171&zoom=16" }));
    render(<NuevoReporte />);
    expect(await screen.findByRole("link", { name: "← Volver al mapa" })).toHaveAttribute(
      "href",
      "/?lat=4.67719&lon=-74.07171&zoom=16"
    );
  });

  it("sin vista guardada vuelve a la página principal", async () => {
    vi.stubGlobal("localStorage", almacenamiento());
    render(<NuevoReporte />);
    expect(await screen.findByRole("link", { name: "← Volver al mapa" })).toHaveAttribute("href", "/");
  });

  it("mantiene el logo y el selector de usuario en la barra", async () => {
    vi.stubGlobal("localStorage", almacenamiento());
    render(<NuevoReporte />);
    const barra = screen.getByRole("banner");
    expect(barra).toContainElement(screen.getByRole("link", { name: "UrbanAlert, ir al mapa" }));
    expect(barra).toContainElement(screen.getByTitle("Cambiar o agregar usuario"));
  });
});

// Spec 004-captcha-reporte: verificación humana con Cloudflare Turnstile (window.turnstile falso).
describe("formulario de nuevo reporte: verificación humana", () => {
  const CATALOGO = [{ codigo: "VIAS_Y_ANDENES", nombre: "Vías y andenes", tipos: [{ codigo: "HUECOS_EN_LA_VIA", nombre: "Huecos" }] }];
  let callbackToken: ((token: string) => void) | undefined;
  const turnstile = {
    render: vi.fn((_: HTMLElement, o: { callback?: (token: string) => void }) => {
      callbackToken = o.callback;
      return "widget-1";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  let respuestaCreacion: () => Response;
  let enviados: FormData[];

  beforeEach(() => {
    vi.clearAllMocks();
    callbackToken = undefined;
    enviados = [];
    respuestaCreacion = () => new Response(JSON.stringify({ idReporte: "r-1" }), { status: 201 });
    window.turnstile = turnstile;
    vi.stubGlobal("localStorage", almacenamiento());
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (url.endsWith("/api/v1/reportes/catalogo")) return Promise.resolve(new Response(JSON.stringify(CATALOGO)));
        if (url.endsWith("/api/v1/reportes") && init?.method === "POST") {
          enviados.push(init.body as FormData);
          return Promise.resolve(respuestaCreacion());
        }
        return Promise.resolve(new Response("[]"));
      })
    );
    Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
    vi.stubGlobal("navigator", {
      ...navigator,
      geolocation: {
        getCurrentPosition: (ok: PositionCallback) =>
          ok({ coords: { latitude: 4.6512, longitude: -74.0561, accuracy: 10 } } as GeolocationPosition),
      },
    });
  });

  afterEach(() => {
    delete window.turnstile;
    vi.unstubAllEnvs();
  });

  async function llenarFormulario(container: HTMLElement) {
    await waitFor(() => expect(container.querySelector('select[name="category"]')).toBeEnabled());
    fireEvent.change(container.querySelector('select[name="category"]')!, { target: { value: "VIAS_Y_ANDENES" } });
    fireEvent.change(container.querySelector('select[name="reportType"]')!, { target: { value: "HUECOS_EN_LA_VIA" } });
    fireEvent.change(container.querySelector('textarea[name="description"]')!, {
      target: { value: "Hueco grande que afecta el tránsito vehicular" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Usar mi ubicación/ }));
    const imagen = new File([new Uint8Array([137, 80, 78, 71])], "hueco.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Imagen del reporte (galería)"), { target: { files: [imagen] } });
  }

  const botonEnviar = () => screen.getByRole("button", { name: "Enviar reporte" });

  it("sin clave pública no muestra la verificación y permite enviar como antes", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const { container } = render(<NuevoReporte />);
    await llenarFormulario(container);

    expect(screen.queryByTestId("widget-turnstile")).not.toBeInTheDocument();
    expect(botonEnviar()).toBeEnabled();
    fireEvent.click(botonEnviar());

    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].has("captchaToken")).toBe(false);
  });

  it("con clave, el envío espera la verificación y lleva captchaToken", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    const { container } = render(<NuevoReporte />);
    await llenarFormulario(container);

    expect(botonEnviar()).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Complete la verificación de seguridad");

    await waitFor(() => expect(callbackToken).toBeDefined());
    act(() => callbackToken!("token-del-widget"));
    expect(botonEnviar()).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("");

    fireEvent.click(botonEnviar());

    await waitFor(() => expect(enviados).toHaveLength(1));
    expect(enviados[0].get("captchaToken")).toBe("token-del-widget");
    // Tras crear el reporte se pide una prueba nueva para el siguiente.
    await waitFor(() => expect(turnstile.reset).toHaveBeenCalledWith("widget-1"));
  });

  it("si el servicio rechaza la verificación, muestra el mensaje, reinicia el widget y conserva los datos", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    respuestaCreacion = () =>
      new Response(JSON.stringify({ message: "No se pudo verificar que la solicitud la hizo una persona. Repite la verificación." }), {
        status: 400,
      });
    const { container } = render(<NuevoReporte />);
    await llenarFormulario(container);
    await waitFor(() => expect(callbackToken).toBeDefined());
    act(() => callbackToken!("token-usado"));

    fireEvent.click(botonEnviar());

    expect(await screen.findByText(/Repite la verificación/)).toBeInTheDocument();
    expect(turnstile.reset).toHaveBeenCalledWith("widget-1");
    expect(botonEnviar()).toBeDisabled();
    expect(container.querySelector<HTMLTextAreaElement>('textarea[name="description"]')!.value).toBe(
      "Hueco grande que afecta el tránsito vehicular"
    );
  });

  it("muestra el mensaje del servicio en un 503 de la verificación", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    respuestaCreacion = () =>
      new Response(JSON.stringify({ message: "No fue posible verificar la solicitud. Intenta nuevamente más tarde." }), { status: 503 });
    const { container } = render(<NuevoReporte />);
    await llenarFormulario(container);
    await waitFor(() => expect(callbackToken).toBeDefined());
    act(() => callbackToken!("token"));

    fireEvent.click(botonEnviar());

    expect(await screen.findByText("No fue posible verificar la solicitud. Intenta nuevamente más tarde.")).toBeInTheDocument();
  });
});
