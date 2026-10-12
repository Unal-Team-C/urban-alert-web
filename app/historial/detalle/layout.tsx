import type { Metadata } from "next";

// Solo el título: el fondo lo pone el layout de /historial.
export const metadata: Metadata = { title: "Detalle del reporte" };

export default function DetalleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
