import type { Metadata } from "next";

// La página es un componente de cliente y no puede exportar metadata: el título va aquí.
export const metadata: Metadata = { title: "Crear reporte" };

export default function NuevoReporteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
