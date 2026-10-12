import Link from "next/link";

// Barra superior de las pantallas principales (spec 002-rediseno-mapa): logo de UrbanAlert a la izquierda,
// enlazado a la página principal, y las acciones de la pantalla (children) a la derecha. Colores fijos,
// como el resto del sitio, para que no cambie con el tema oscuro del sistema.
export default function BarraSuperior({ children }: { children?: React.ReactNode }) {
  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 text-gray-900 shadow-sm sm:px-5"
    >
      <Link href="/" className="flex h-full items-center" aria-label="UrbanAlert, ir al mapa">
        {/* Imagen estática: la exportación no optimiza imágenes con next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-urbanalert.png" alt="UrbanAlert" width={63} height={48} className="h-12 w-auto" />
      </Link>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
