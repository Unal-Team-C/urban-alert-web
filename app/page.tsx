import Link from "next/link";

// Página de bienvenida: el mapa de daños (/mapa) en un iframe y el acceso al formulario.
// Mismos estilos que el formulario de crear reporte.
export default function Inicio() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido a UrbanAlert
        </h1>

        <p className="mt-2 mb-6 text-gray-500">
          Consulte los daños urbanos reportados en Bogotá o reporte uno nuevo.
        </p>

        <iframe
          src="/mapa"
          title="Mapa de daños reportados"
          className="h-[60vh] min-h-[360px] w-full rounded-lg border border-gray-300"
        />

        <Link
          href="/reportes/nuevo"
          className="mt-6 block w-full rounded-lg bg-black py-3 text-center font-medium text-white hover:bg-gray-800"
        >
          Crear reporte
        </Link>
      </div>
    </main>
  );
}
