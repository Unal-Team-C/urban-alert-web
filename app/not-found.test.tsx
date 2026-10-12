import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NoEncontrada, { metadata } from "./not-found";

describe("página no encontrada", () => {
  it("explica en español y lleva al mapa", () => {
    render(<NoEncontrada />);
    expect(screen.getByRole("heading", { name: "Página no encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al mapa" })).toHaveAttribute("href", "/");
  });

  it("tiene su título", () => {
    expect(metadata.title).toBe("Página no encontrada");
  });
});
