"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { cargarTurnstile } from "../lib/turnstile";

export const ACCION_CREAR_REPORTE = "crear-reporte";

export type ControlVerificacion = {
  // Descarta la prueba actual y pide una nueva (la prueba es de un solo uso; spec 004 RF-004).
  reiniciar: () => void;
};

type Props = {
  claveSitio: string;
  // Prueba vigente, o null cuando todavía no hay, venció o el desafío falló.
  onToken: (token: string | null) => void;
  ref?: Ref<ControlVerificacion>;
};

// Widget de Cloudflare Turnstile (spec 004-captcha-reporte). Normalmente se resuelve solo; a veces pide un clic.
// Sigue el tema del sistema (theme "auto"), igual que el sitio.
export default function VerificacionHumana({ claveSitio, onToken, ref }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const idWidgetRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let cancelado = false;

    cargarTurnstile()
      .then((turnstile) => {
        if (cancelado || !contenedorRef.current) return;
        idWidgetRef.current = turnstile.render(contenedorRef.current, {
          sitekey: claveSitio,
          action: ACCION_CREAR_REPORTE,
          theme: "auto",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
        setEstado("listo");
      })
      .catch(() => {
        if (!cancelado) setEstado("error");
      });

    return () => {
      cancelado = true;
      if (idWidgetRef.current) window.turnstile?.remove(idWidgetRef.current);
      idWidgetRef.current = null;
    };
  }, [claveSitio]);

  useImperativeHandle(ref, () => ({
    reiniciar() {
      if (idWidgetRef.current) window.turnstile?.reset(idWidgetRef.current);
      onTokenRef.current(null);
    },
  }));

  return (
    <div>
      <div ref={contenedorRef} data-testid="widget-turnstile" className="min-h-[65px] max-w-full overflow-hidden" />
      {estado === "cargando" && <p className="text-xs text-gray-500">Cargando la verificación…</p>}
      {estado === "error" && (
        <p role="alert" className="text-sm text-red-600">
          No se pudo cargar la verificación de seguridad. Revise su conexión o desactive el bloqueador de contenido y
          recargue la página.
        </p>
      )}
    </div>
  );
}
