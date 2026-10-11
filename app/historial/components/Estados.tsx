export function Cargando({ texto = "Cargando..." }: { texto?: string }) {
  return (
    <p role="status" className="py-8 text-center text-gray-500">
      {texto}
    </p>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return <p className="py-8 text-center text-gray-500">{texto}</p>;
}

export function ErrorReintentar({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
      <p>{mensaje}</p>
      <button
        type="button"
        onClick={onReintentar}
        className="mt-2 rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
      >
        Reintentar
      </button>
    </div>
  );
}
