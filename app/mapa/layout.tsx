// Fondo y color de texto propios, igual que el formulario y /historial: el módulo se ve igual
// con el tema claro u oscuro del sistema (globals.css cambia el color base en modo oscuro).
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen bg-gray-100 text-gray-900">{children}</div>;
}
