// Errores de la API: {"message"} desde el middleware o ProblemDetails de ASP.NET
// ({"title", "errors"}) cuando el JSON no se puede convertir.
type ErrorApi = { message?: string; title?: string; errors?: Record<string, string[]> };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

// URL de la API: base del API Gateway compartido + ruta pública (/api/v1/...).
// En AWS la base se lee del contrato SSM de la plataforma en el build (NEXT_PUBLIC_API_URL, spec 001 D-002);
// sin base (npm run dev) la ruta queda relativa y los rewrites de next.config.ts la reenvían.
// process.env.NEXT_PUBLIC_API_URL debe escribirse literal: Next.js lo sustituye en el build.
export function urlApi(ruta: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return `${base}${ruta}`;
}

async function mensajeDe(response: Response): Promise<string> {
  const error = (await response.json().catch(() => null)) as ErrorApi | null;
  const detalle = error?.errors ? Object.values(error.errors).flat()[0] : undefined;
  return error?.message ?? detalle ?? error?.title ?? `Error inesperado (HTTP ${response.status}).`;
}

// GET a la API (ruta /api/v1/...) que devuelve JSON. Lanza ApiError con el estado HTTP, o con
// estado 0 si no hubo respuesta (red caída). Una petición abortada relanza el AbortError.
export async function obtenerJson<T>(ruta: string, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(urlApi(ruta), { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "No fue posible conectar con el servidor.");
  }
  if (!response.ok) throw new ApiError(response.status, await mensajeDe(response));
  return (await response.json()) as T;
}

export function esAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
