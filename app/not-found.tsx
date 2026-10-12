import type { Metadata } from "next";
import Link from "next/link";

// Página de ruta inexistente (out/404.html en la exportación; CloudFront la sirve con estado 404).
export const metadata: Metadata = { title: "Página no encontrada" };

export default function NoEncontrada() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-gray-500">La dirección que abrió no existe en UrbanAlert.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
        >
          Ir al mapa
        </Link>
      </div>
    </main>
  );
}
