"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { obtenerCoordenada } from "../../lib/geoespacial";
import { obtenerCatalogo, obtenerReporte } from "../../lib/reportes";
import { listarUsuarios } from "../../lib/usuarios";
import { Cargando, ErrorReintentar } from "../components/Estados";
import DetalleReporte from "../components/DetalleReporte";
import LineaDeTiempo from "../components/LineaDeTiempo";
import VerificacionIntegridad from "../components/VerificacionIntegridad";
import { useCarga } from "../../lib/useCarga";

// /historial/detalle/?id=<id>: el id va en la query porque la exportación estática no admite rutas
// dinámicas con ids que solo existen en tiempo de ejecución (spec 001-migracion-aws, plan D-003).
// useSearchParams exige un límite de Suspense para poder prerenderizar la página.
export default function DetalleReportePage() {
  return (
    <Suspense fallback={<Cargando texto="Cargando reporte..." />}>
      <DetallePorQuery />
    </Suspense>
  );
}

function DetallePorQuery() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <Marco>
        <NoEncontrado />
      </Marco>
    );
  }
  return <Detalle id={id} />;
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Link href="/historial" className="text-sm text-blue-600 hover:underline">
        ← Volver al histórico
      </Link>
      {children}
    </main>
  );
}

function NoEncontrado() {
  return (
    <p role="alert" className="py-8 text-center text-gray-700">
      Reporte no encontrado.
    </p>
  );
}

function Detalle({ id }: { id: string }) {

  const reporte = useCarga((signal) => obtenerReporte(id, signal), id);
  const catalogo = useCarga(obtenerCatalogo, "catalogo");
  const usuarios = useCarga(listarUsuarios, "usuarios");
  const coordenada = useCarga(
    (signal) => obtenerCoordenada(reporte.datos!.idCoordenada, signal),
    reporte.datos ? reporte.datos.idCoordenada : null
  );

  return (
    <Marco>
      {reporte.cargando ? (
        <Cargando texto="Cargando reporte..." />
      ) : reporte.error?.status === 404 ? (
        <NoEncontrado />
      ) : reporte.error ? (
        <ErrorReintentar mensaje={reporte.error.message} onReintentar={reporte.reintentar} />
      ) : reporte.datos ? (
        <>
          <DetalleReporte
            reporte={reporte.datos}
            catalogo={catalogo.datos ?? []}
            usuarios={usuarios.datos ?? []}
            coordenada={coordenada.datos}
            errorCoordenada={!!coordenada.error}
          />
          <LineaDeTiempo idReporte={id} usuarios={usuarios.datos ?? []} />
          <VerificacionIntegridad idReporte={id} />
        </>
      ) : null}
    </Marco>
  );
}
