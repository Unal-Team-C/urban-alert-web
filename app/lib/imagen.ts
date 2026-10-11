// Mismas reglas que valida el servicio de Reportes (que además revisa el contenido real).
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];
export const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024;

export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) {
    return "La imagen debe estar en formato JPEG, PNG o WebP.";
  }
  if (archivo.size > TAMANO_MAXIMO_IMAGEN) {
    return "La imagen no puede superar 10 MB.";
  }
  return null;
}

export function formatearTamano(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
