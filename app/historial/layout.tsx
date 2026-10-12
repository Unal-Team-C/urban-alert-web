import type { Metadata } from "next";

import BarraSuperior from "../components/BarraSuperior";
import VolverAlMapa from "../components/VolverAlMapa";

// Con plantilla propia: un título de texto aquí cortaría la de la raíz para /historial/detalle.
export const metadata: Metadata = {
  title: { default: "Histórico de reportes", template: "%s · UrbanAlert" },
};

// Igual que el formulario: fondo y color de texto propios, para que el módulo se vea igual
// con el tema claro u oscuro del sistema (globals.css cambia el color base en modo oscuro).
// La barra con «Volver al inicio» (spec 002, HU-6) la comparten el histórico y el detalle de un reporte.
export default function HistorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <BarraSuperior>
        <VolverAlMapa texto="← Volver al inicio" />
      </BarraSuperior>
      {children}
    </div>
  );
}
