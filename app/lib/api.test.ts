import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, obtenerJson } from "./api";

function responder(status: number, cuerpo: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }))
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("obtenerJson", () => {
  it("devuelve el JSON cuando la respuesta es correcta", async () => {
    responder(200, { a: 1 });
    expect(await obtenerJson("/x")).toEqual({ a: 1 });
  });

  it("usa message del middleware", async () => {
    responder(400, { message: "Parámetro inválido" });
    await expect(obtenerJson("/x")).rejects.toMatchObject({ status: 400, message: "Parámetro inválido" });
  });

  it("usa el primer error de ProblemDetails", async () => {
    responder(400, { title: "Validación", errors: { Estado: ["Estado inválido"] } });
    await expect(obtenerJson("/x")).rejects.toMatchObject({ message: "Estado inválido" });
  });

  it("cae a un mensaje genérico con el estado HTTP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("no json", { status: 502 })));
    await expect(obtenerJson("/x")).rejects.toMatchObject({ status: 502, message: "Error inesperado (HTTP 502)." });
  });

  it("falla con estado 0 si no hay red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    const error = (await obtenerJson("/x").catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it("relanza el AbortError sin envolverlo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("abort", "AbortError")));
    await expect(obtenerJson("/x")).rejects.toMatchObject({ name: "AbortError" });
  });
});
