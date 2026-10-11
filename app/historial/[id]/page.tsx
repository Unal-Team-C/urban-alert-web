"use client";

import { use } from "react";
import Link from "next/link";
import { obtenerCoordenada } from "../../lib/geoespacial";
import { obtenerCatalogo, obtenerReporte } from "../../lib/reportes";
import { listarUsuarios } from "../../lib/usuarios";
import { Cargando, ErrorReintentar } from "../components/Estados";
import DetalleReporte from "../components/DetalleReporte";
import LineaDeTiempo from "../components/LineaDeTiempo";
import VerificacionIntegridad from "../components/VerificacionIntegridad";
import { useCarga } from "../../lib/useCarga";

export default function DetalleReportePage({ params }: PageProps<"/historial/[id]">) {
  const { id } = use(params);

  const reporte = useCarga((signal) => obtenerReporte(id, signal), id);
  const catalogo = useCarga(obtenerCatalogo, "catalogo");
  const usuarios = useCarga(listarUsuarios, "usuarios");
  const coordenada = useCarga(
    (signal) => obtenerCoordenada(reporte.datos!.idCoordenada, signal),
    reporte.datos ? reporte.datos.idCoordenada : null
  );

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <Link href="/historial" className="text-sm text-blue-600 hover:underline">
        ← Volver al histórico
      </Link>

      {reporte.cargando ? (
        <Cargando texto="Cargando reporte..." />
      ) : reporte.error?.status === 404 ? (
        <p role="alert" className="py-8 text-center text-gray-700">
          Reporte no encontrado.
        </p>
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
    </main>
  );
}
