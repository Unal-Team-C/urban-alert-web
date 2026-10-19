import { afterEach, describe, expect, it, vi } from "vitest";
import { URL_SCRIPT_TURNSTILE, cargarTurnstile, claveSitioTurnstile, olvidarCargaTurnstile, type Turnstile } from "./turnstile";

const falso: Turnstile = { render: vi.fn(), reset: vi.fn(), remove: vi.fn() };

function scripts(): HTMLScriptElement[] {
  return [...document.head.querySelectorAll<HTMLScriptElement>(`script[src="${URL_SCRIPT_TURNSTILE}"]`)];
}

afterEach(() => {
  scripts().forEach((s) => s.remove());
  delete window.turnstile;
  olvidarCargaTurnstile();
  vi.unstubAllEnvs();
});

describe("cargarTurnstile", () => {
  it("añade un solo script aunque se pida dos veces y resuelve con window.turnstile", async () => {
    const primera = cargarTurnstile();
    const segunda = cargarTurnstile();
    expect(scripts()).toHaveLength(1);

    window.turnstile = falso;
    scripts()[0].dispatchEvent(new Event("load"));

    await expect(primera).resolves.toBe(falso);
    await expect(segunda).resolves.toBe(falso);
  });

  it("si ya está cargado no añade el script", async () => {
    window.turnstile = falso;
    await expect(cargarTurnstile()).resolves.toBe(falso);
    expect(scripts()).toHaveLength(0);
  });

  it("rechaza si el script no carga y permite reintentar", async () => {
    const intento = cargarTurnstile();
    scripts()[0].dispatchEvent(new Event("error"));

    await expect(intento).rejects.toThrow("No se pudo cargar");
    expect(scripts()).toHaveLength(0);

    void cargarTurnstile().catch(() => {});
    expect(scripts()).toHaveLength(1);
  });
});

describe("claveSitioTurnstile", () => {
  it("lee la clave pública del build", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", " 1x00000000000000000000AA ");
    expect(claveSitioTurnstile()).toBe("1x00000000000000000000AA");
  });

  it("sin clave devuelve vacío", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    expect(claveSitioTurnstile()).toBe("");
  });
});
