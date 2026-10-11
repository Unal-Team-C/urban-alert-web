// Forma de GET /api/v1/users (servicio de Usuarios).
export type Usuario = { id: string; name: string; email: string; role: "USER" | "ADMIN" };

// Errores del servicio de Usuarios: {"code", "message"}.
type ErrorUsuarios = { code?: number; message?: string };

// Mientras no haya inicio de sesión, el reporte se atribuye a un ciudadano (rol USER)
// elegido al azar entre los registrados, o al que se eligió antes en este navegador.
export function elegirCiudadanoAlAzar(usuarios: Usuario[]): Usuario | null {
  const ciudadanos = usuarios.filter((usuario) => usuario.role === "USER");
  if (ciudadanos.length === 0) return null;
  return ciudadanos[Math.floor(Math.random() * ciudadanos.length)];
}

const CLAVE_USUARIO = "urbanalert.idUsuario";

export function leerUsuarioGuardado(): string | null {
  try {
    return localStorage.getItem(CLAVE_USUARIO);
  } catch {
    return null;
  }
}

export function guardarUsuario(id: string) {
  try {
    localStorage.setItem(CLAVE_USUARIO, id);
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): solo dura hasta recargar.
  }
}

// POST /api/v1/users. El rol queda en USER (valor por defecto del servicio).
export async function crearUsuario(name: string, email: string): Promise<Usuario> {
  const response = await fetch("/api/v1/usuarios", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });

  if (response.ok) {
    const creado = (await response.json()) as { id: string };
    return { id: creado.id, name, email, role: "USER" };
  }

  if (response.status === 409) {
    throw new Error("Ese correo ya está registrado.");
  }
  if (response.status === 400) {
    const error = (await response.json().catch(() => null)) as ErrorUsuarios | null;
    throw new Error(
      error?.message === "Invalid email format"
        ? "El correo no tiene un formato válido."
        : "Revise el nombre y el correo."
    );
  }
  throw new Error("No fue posible crear el usuario. Intente nuevamente más tarde.");
}

// GET /api/v1/users. Lista completa, para mostrar nombres en lugar de ids.
export async function listarUsuarios(signal?: AbortSignal): Promise<Usuario[]> {
  const response = await fetch("/api/v1/usuarios", { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as Usuario[];
}

export function nombreDeUsuario(usuarios: Usuario[], id: string): string {
  return usuarios.find((usuario) => usuario.id === id)?.name ?? id.slice(0, 8);
}
