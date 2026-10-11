const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  dateStyle: "medium",
  timeStyle: "short",
});

// El backend entrega UTC; se muestra en hora de Bogotá. Una fecha inválida se devuelve tal cual.
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? iso : FORMATO_FECHA.format(fecha);
}

export function idCorto(id: string): string {
  return id.slice(0, 8);
}
