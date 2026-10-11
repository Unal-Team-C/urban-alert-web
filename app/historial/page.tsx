"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { esAbortError, type ApiError } from "../lib/api";
import type { CategoriaCatalogo } from "../lib/catalogo";
import {
  listarReportes,
  obtenerCatalogo,
  type FiltrosReportes,
  type Pagina,
  type Reporte,
} from "../lib/reportes";
import { Cargando, ErrorReintentar, Vacio } from "./components/Estados";
import FiltrosHistorial from "./components/FiltrosHistorial";
import TotalesPorTipo from "./components/TotalesPorTipo";
import TablaReportes from "./components/TablaReportes";
import TotalesGrid from "./components/TotalesGrid";

function Historial() {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();

  const filtros: FiltrosReportes = {
    estado: parametros.get("estado") ?? undefined,
    nivelEmergencia: parametros.get("nivel") ?? undefined,
    tipo: parametros.get("tipo") ?? undefined,
  };
  const pagina = Math.max(1, Number(parametros.get("pagina")) || 1);

  // El resultado se guarda junto a la petición que lo produjo: "cargando" es que el
  // último resultado no corresponde a la petición actual, sin setState síncrono en el efecto.
  const [resultado, setResultado] = useState<{
    clave: string;
    datos?: Pagina<Reporte>;
    error?: string;
  } | null>(null);
  const [catalogo, setCatalogo] = useState<CategoriaCatalogo[]>([]);
  const [intento, setIntento] = useState(0);

  const estado = filtros.estado;
  const nivel = filtros.nivelEmergencia;
  const tipo = filtros.tipo;
  const clave = `${estado ?? ""}|${nivel ?? ""}|${tipo ?? ""}|${pagina}|${intento}`;
  const cargando = resultado?.clave !== clave;
  const datos = resultado?.datos ?? null;
  const error = cargando ? "" : (resultado?.error ?? "");

  useEffect(() => {
    obtenerCatalogo()
      .then(setCatalogo)
      .catch(() => setCatalogo([])); // sin catálogo se muestran los códigos
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    listarReportes({ estado, nivelEmergencia: nivel, tipo }, pagina, controlador.signal)
      .then((pagina) => setResultado({ clave, datos: pagina }))
      .catch((e: ApiError) => {
        if (esAbortError(e)) return;
        setResultado((previo) => ({ clave, datos: previo?.datos, error: e.message }));
      });
    return () => controlador.abort();
  }, [estado, nivel, tipo, pagina, clave]);

  const navegar = useCallback(
    (cambios: Record<string, string>) => {
      const query = new URLSearchParams(parametros.toString());
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) query.set(clave, valor);
        else query.delete(clave);
      }
      const texto = query.toString();
      router.push(texto ? `${pathname}?${texto}` : pathname);
    },
    [parametros, pathname, router]
  );

  // Cambiar un filtro vuelve a la página 1.
  const cambiarFiltro = (filtro: keyof FiltrosReportes, valor: string) =>
    navegar({ [filtro === "nivelEmergencia" ? "nivel" : filtro]: valor, pagina: "" });

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">Histórico de reportes</h1>
        <p className="text-gray-500">Vista de administrador de todos los reportes registrados.</p>
      </header>

      <TotalesGrid filtros={filtros} onSeleccionar={cambiarFiltro} />
      <TotalesPorTipo catalogo={catalogo} filtros={filtros} onSeleccionar={cambiarFiltro} />
      <FiltrosHistorial filtros={filtros} catalogo={catalogo} onCambiar={cambiarFiltro} />

      {error ? (
        <ErrorReintentar mensaje={error} onReintentar={() => setIntento((n) => n + 1)} />
      ) : cargando && !datos ? (
        <Cargando texto="Cargando reportes..." />
      ) : datos && datos.elementos.length === 0 ? (
        <Vacio texto="No hay reportes con esos filtros." />
      ) : datos ? (
        <div aria-busy={cargando} className={cargando ? "opacity-60" : undefined}>
          <TablaReportes
            datos={datos}
            catalogo={catalogo}
            onPagina={(p) => navegar({ pagina: p > 1 ? String(p) : "" })}
          />
        </div>
      ) : null}
    </main>
  );
}

export default function HistorialPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <Historial />
    </Suspense>
  );
}
