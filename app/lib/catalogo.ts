// Códigos que emite Reportes (UPPER_SNAKE_CASE). El catálogo del servicio solo cubre
// categoría y tipo; estado y nivel se etiquetan aquí.
export const ESTADOS = [
  { codigo: "REPORTADO", nombre: "Reportado" },
  { codigo: "VERIFICADO", nombre: "Verificado" },
  { codigo: "ASIGNADO", nombre: "Asignado" },
  { codigo: "EN_INTERVENCION", nombre: "En intervención" },
  { codigo: "RESUELTO", nombre: "Resuelto" },
  { codigo: "RECHAZADO", nombre: "Rechazado" },
] as const;

export const NIVELES = [
  { codigo: "DEFAULT", nombre: "Por definir" },
  { codigo: "BAJA", nombre: "Baja" },
  { codigo: "MEDIA", nombre: "Media" },
  { codigo: "ALTA", nombre: "Alta" },
] as const;

export type TipoCatalogo = { codigo: string; nombre: string };
export type CategoriaCatalogo = { codigo: string; nombre: string; tipos: TipoCatalogo[] };

function etiquetaDe(lista: readonly { codigo: string; nombre: string }[], codigo: string): string {
  return lista.find((item) => item.codigo === codigo)?.nombre ?? codigo;
}

export const nombreEstado = (codigo: string) => etiquetaDe(ESTADOS, codigo);
export const nombreNivel = (codigo: string) => etiquetaDe(NIVELES, codigo);

export function nombreCategoria(catalogo: CategoriaCatalogo[], codigo: string): string {
  return etiquetaDe(catalogo, codigo);
}

export function nombreTipo(catalogo: CategoriaCatalogo[], codigo: string): string {
  return etiquetaDe(
    catalogo.flatMap((categoria) => categoria.tipos),
    codigo
  );
}
