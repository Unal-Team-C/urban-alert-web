import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, obtenerJson, urlApi } from "./api";

function responder(status: number, cuerpo: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(JSON.stringify(cuerpo), { status }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("urlApi", () => {
  it("deja la ruta relativa sin URL del gateway (desarrollo local)", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    expect(urlApi("/api/v1/reportes")).toBe("/api/v1/reportes");
  });

  it("antepone la URL del gateway", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://abc.execute-api.us-east-2.amazonaws.com");
    expect(urlApi("/api/v1/reportes?pagina=1")).toBe(
      "https://abc.execute-api.us-east-2.amazonaws.com/api/v1/reportes?pagina=1"
    );
  });

  it("ignora las barras finales de la URL del gateway", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://abc.execute-api.us-east-2.amazonaws.com//");
    expect(urlApi("/api/v1/usuarios")).toBe("https://abc.execute-api.us-east-2.amazonaws.com/api/v1/usuarios");
  });
});

describe("obtenerJson", () => {
  it("devuelve el JSON cuando la respuesta es correcta", async () => {
    responder(200, { a: 1 });
    expect(await obtenerJson("/x")).toEqual({ a: 1 });
  });

  it("llama al API Gateway cuando hay URL configurada", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://gw.example");
    responder(200, []);
    await obtenerJson("/api/v1/reportes");
    expect(fetch).toHaveBeenCalledWith("https://gw.example/api/v1/reportes", { signal: undefined });
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
