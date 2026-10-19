import { act, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { URL_SCRIPT_TURNSTILE, olvidarCargaTurnstile, type OpcionesWidget } from "../lib/turnstile";
import VerificacionHumana, { type ControlVerificacion } from "./VerificacionHumana";

let opciones: OpcionesWidget | undefined;
const turnstile = {
  render: vi.fn((_: HTMLElement, o: OpcionesWidget) => {
    opciones = o;
    return "widget-1";
  }),
  reset: vi.fn(),
  remove: vi.fn(),
};

beforeEach(() => {
  opciones = undefined;
  vi.clearAllMocks();
  window.turnstile = turnstile;
});

afterEach(() => {
  delete window.turnstile;
  olvidarCargaTurnstile();
  document.head.querySelectorAll(`script[src="${URL_SCRIPT_TURNSTILE}"]`).forEach((s) => s.remove());
});

describe("VerificacionHumana", () => {
  it("renderiza el widget con la clave, la acción crear-reporte y el tema claro del formulario", async () => {
    render(<VerificacionHumana claveSitio="1x00000000000000000000AA" onToken={vi.fn()} />);

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));
    expect(turnstile.render.mock.calls[0][0]).toBe(screen.getByTestId("widget-turnstile"));
    expect(opciones).toMatchObject({ sitekey: "1x00000000000000000000AA", action: "crear-reporte", theme: "light" });
  });

  it("usa el tamaño compacto si el contenedor mide menos de 300 px y el normal si no", async () => {
    const ancho = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(263);
    const { unmount } = render(<VerificacionHumana claveSitio="clave" onToken={vi.fn()} />);
    await waitFor(() => expect(opciones?.size).toBe("compact"));
    unmount();

    opciones = undefined;
    ancho.mockReturnValue(320);
    render(<VerificacionHumana claveSitio="clave" onToken={vi.fn()} />);
    await waitFor(() => expect(opciones?.size).toBe("normal"));
    ancho.mockRestore();
  });

  it("entrega la prueba y la descarta al vencer o fallar el desafío", async () => {
    const onToken = vi.fn();
    render(<VerificacionHumana claveSitio="clave" onToken={onToken} />);
    await waitFor(() => expect(opciones).toBeDefined());

    act(() => opciones!.callback!("token-1"));
    expect(onToken).toHaveBeenLastCalledWith("token-1");

    act(() => opciones!["expired-callback"]!());
    expect(onToken).toHaveBeenLastCalledWith(null);

    act(() => opciones!.callback!("token-2"));
    act(() => opciones!["error-callback"]!());
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("reiniciar() reinicia el widget y descarta la prueba", async () => {
    const onToken = vi.fn();
    const control = createRef<ControlVerificacion>();
    render(<VerificacionHumana claveSitio="clave" onToken={onToken} ref={control} />);
    await waitFor(() => expect(opciones).toBeDefined());

    act(() => control.current!.reiniciar());

    expect(turnstile.reset).toHaveBeenCalledWith("widget-1");
    expect(onToken).toHaveBeenLastCalledWith(null);
  });

  it("al desmontarse quita el widget", async () => {
    const { unmount } = render(<VerificacionHumana claveSitio="clave" onToken={vi.fn()} />);
    await waitFor(() => expect(opciones).toBeDefined());

    unmount();

    expect(turnstile.remove).toHaveBeenCalledWith("widget-1");
  });

  it("si el script no carga muestra un error", async () => {
    delete window.turnstile;
    render(<VerificacionHumana claveSitio="clave" onToken={vi.fn()} />);

    const script = document.head.querySelector(`script[src="${URL_SCRIPT_TURNSTILE}"]`)!;
    act(() => void script.dispatchEvent(new Event("error")));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo cargar la verificación");
  });
});
