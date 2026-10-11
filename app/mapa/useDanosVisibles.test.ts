import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { celdasVisibles } from "../lib/celdas";
import { useDanosVisibles, TTL_CELDA_MS, type VistaDatos } from "./useDanosVisibles";

// Zona pequeña en Chapinero: a zoom 15 cubre dos celdas de 4 km.
const LIMITES = { latMin: 4.62, latMax: 4.65, lonMin: -74.07, lonMax: -74.05 };

function centroDe(url: string) {
  const query = new URL(url, "http://x").searchParams;
  return { lat: Number(query.get("lat")), lon: Number(query.get("lon")) };
}

// Cada petición devuelve un daño en el centro de la celda pedida y otro muy lejos (fuera de la celda).
function mockGeoespacial(falla: (centro: { lat: number; lon: number }) => boolean = () => false) {
  const fetch = vi.fn((url: string) => {
    const centro = centroDe(url);
    if (falla(centro)) return Promise.resolve(new Response("{}", { status: 503 }));
    const cuerpo = [
      { reportId: `r-${centro.lat}-${centro.lon}`, coordinateId: "c", coordinate: centro },
      { reportId: "lejos", coordinateId: "c", coordinate: { lat: 4.2, lon: -74.3 } },
    ];
    return Promise.resolve(new Response(JSON.stringify(cuerpo), { status: 200 }));
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function renderizar(vista: VistaDatos) {
  return renderHook(({ v }) => useDanosVisibles(v), { initialProps: { v: vista } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("useDanosVisibles", () => {
  it("pide cada celda visible y conserva solo los puntos dentro de ella", async () => {
    const celdas = celdasVisibles(LIMITES, 15);
    expect(celdas.length).toBe(2);
    const fetch = mockGeoespacial();
    const { result } = renderizar({ limites: LIMITES, zoom: 15 });

    expect(result.current.cargando).toBe(true);
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.puntos.map((p) => p.reportId)).not.toContain("lejos");
    expect(result.current.puntos).toHaveLength(2);
  });

  it("no vuelve a pedir una celda en caché al cambiar la vista dentro del TTL", async () => {
    const fetch = mockGeoespacial();
    const { result, rerender } = renderizar({ limites: LIMITES, zoom: 15 });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    rerender({ v: { limites: { ...LIMITES }, zoom: 15 } });
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("vuelve a pedir la celda cuando venció el TTL", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = mockGeoespacial();
    const { result, rerender } = renderizar({ limites: LIMITES, zoom: 15 });
    await waitFor(() => expect(result.current.cargando).toBe(false));

    vi.setSystemTime(Date.now() + TTL_CELDA_MS + 1);
    rerender({ v: { limites: { ...LIMITES }, zoom: 15 } });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
  });

  it("al acercarse usa la celda mayor ya cargada, sin pedir", async () => {
    const fetch = mockGeoespacial();
    const { result, rerender } = renderizar({ limites: LIMITES, zoom: 14 });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    const pedidas = fetch.mock.calls.length;

    rerender({ v: { limites: { latMin: 4.63, latMax: 4.632, lonMin: -74.06, lonMax: -74.058 }, zoom: 18 } });
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(pedidas);
    expect(result.current.cargando).toBe(false);
  });

  it("una celda que falla no oculta las demás y reintentar pide solo la fallida", async () => {
    const [primera] = celdasVisibles(LIMITES, 15);
    let fallar = true;
    const fetch = mockGeoespacial((c) => fallar && c.lat === primera.centro.lat && c.lon === primera.centro.lon);
    const { result } = renderizar({ limites: LIMITES, zoom: 15 });

    await waitFor(() => expect(result.current.celdasFallidas).toBe(1));
    expect(result.current.cargando).toBe(false);
    expect(result.current.puntos).toHaveLength(1);

    fallar = false;
    act(() => result.current.reintentar());
    await waitFor(() => expect(result.current.celdasFallidas).toBe(0));
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result.current.puntos).toHaveLength(2);
  });

  it("no reintenta sola una celda fallida al mover el mapa", async () => {
    const fetch = mockGeoespacial(() => true);
    const { result, rerender } = renderizar({ limites: LIMITES, zoom: 15 });
    await waitFor(() => expect(result.current.celdasFallidas).toBe(2));

    rerender({ v: { limites: { ...LIMITES }, zoom: 15 } });
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("no cancela las celdas que dejan de verse: terminan en caché y no se repiten al volver", async () => {
    const fetch = mockGeoespacial();
    const { result, rerender } = renderizar({ limites: LIMITES, zoom: 15 });
    rerender({ v: { limites: { latMin: 4.7, latMax: 4.71, lonMin: -74.1, lonMax: -74.09 }, zoom: 15 } });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    const pedidas = fetch.mock.calls.length;

    rerender({ v: { limites: LIMITES, zoom: 15 } });
    await act(async () => {});
    expect(fetch).toHaveBeenCalledTimes(pedidas);
    expect(result.current.puntos).toHaveLength(2);
  });

  it("cancela las peticiones en curso al desmontar", async () => {
    const señales: AbortSignal[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        señales.push(init!.signal!);
        return new Promise<Response>(() => {});
      })
    );
    const { unmount } = renderizar({ limites: LIMITES, zoom: 15 });
    await act(async () => {});
    expect(señales).toHaveLength(2);
    unmount();
    expect(señales.every((s) => s.aborted)).toBe(true);
  });

  it("sin vista no pide nada", async () => {
    const fetch = mockGeoespacial();
    const { result } = renderHook(() => useDanosVisibles(null));
    await act(async () => {});
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ puntos: [], cargando: false, celdasFallidas: 0 });
  });
});

describe("useDanosVisibles con áreas completas", () => {
  // Área (p. ej. una localidad) que sale de la vista.
  const AREA = { latMin: 4.6, latMax: 4.75, lonMin: -74.12, lonMax: -74.05 };

  it("carga también las celdas de las áreas y dice cuándo están listas", async () => {
    const fetch = mockGeoespacial();
    const vista = { limites: LIMITES, zoom: 13 };
    const areas = [AREA];
    const { result } = renderHook(() => useDanosVisibles(vista, areas));

    expect(result.current.estadoDe(AREA)).toBe("cargando");
    await waitFor(() => expect(result.current.estadoDe(AREA)).toBe("lista"));
    const esperadas = new Set([...celdasVisibles(LIMITES, 13), ...celdasVisibles(AREA, 13)].map((c) => c.clave));
    expect(fetch).toHaveBeenCalledTimes(esperadas.size);
  });

  it("un área con una celda fallida queda como fallida", async () => {
    const [primera] = celdasVisibles(AREA, 13);
    mockGeoespacial((c) => c.lat === primera.centro.lat && c.lon === primera.centro.lon);
    const vista = { limites: AREA, zoom: 13 };
    const { result } = renderHook(() => useDanosVisibles(vista, [AREA]));
    await waitFor(() => expect(result.current.estadoDe(AREA)).toBe("fallida"));
  });
});
