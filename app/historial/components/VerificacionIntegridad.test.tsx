import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import VerificacionIntegridad from "./VerificacionIntegridad";

function integridad(verified: boolean, brokenSequence: number | null) {
  return new Response(
    JSON.stringify({
      reportId: "r1", verified, reportEventCount: 1, chainEventCount: 1,
      headMatches: verified, brokenSequence, checkedAt: "2026-10-06T21:15:42Z",
    }),
    { status: 200 }
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("VerificacionIntegridad", () => {
  it("no consulta hasta que se pulsa el botón", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<VerificacionIntegridad idReporte="r1" />);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("muestra Válida", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(integridad(true, null)));
    render(<VerificacionIntegridad idReporte="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "Verificar integridad" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Válida");
  });

  it("muestra Alterada con la secuencia rota", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(integridad(false, 7)));
    render(<VerificacionIntegridad idReporte="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "Verificar integridad" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Alterada (secuencia 7)");
  });

  it("muestra el error si la consulta falla", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"message":"Prohibido"}', { status: 403 })));
    render(<VerificacionIntegridad idReporte="r1" />);
    await userEvent.click(screen.getByRole("button", { name: "Verificar integridad" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Prohibido");
  });
});
