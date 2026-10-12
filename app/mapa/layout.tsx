import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mapa de daños" };

// La pantalla pone su propio fondo y alto (components/VistaPrincipal.tsx).
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
