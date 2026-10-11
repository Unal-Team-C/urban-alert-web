import { afterEach, describe, expect, it, vi } from "vitest";
import { listarCercanos } from "./geoespacial";

afterEach(() => vi.unstubAllGlobals());

describe("listarCercanos", () => {
  it("pide la consulta de cercanía con lat, lon y radio", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("[]", { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    expect(await listarCercanos({ lat: 4.6486, lon: -74.0628 }, 5700)).toEqual([]);
    expect(fetch.mock.calls[0][0]).toBe("/api/v1/geoespacial/reports?lat=4.6486&lon=-74.0628&radius=5700");
  });

  it("propaga el mensaje de error de Geoespacial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 400, message: "radius must be greater than 0" }), { status: 400 }))
    );
    await expect(listarCercanos({ lat: 4.6, lon: -74.1 }, 0)).rejects.toMatchObject({
      status: 400,
      message: "radius must be greater than 0",
    });
  });
});
