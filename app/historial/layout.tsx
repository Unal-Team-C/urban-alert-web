// Igual que el formulario: fondo y color de texto propios, para que el módulo se vea igual
// con el tema claro u oscuro del sistema (globals.css cambia el color base en modo oscuro).
export default function HistorialLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-100 text-gray-900">{children}</div>;
}
