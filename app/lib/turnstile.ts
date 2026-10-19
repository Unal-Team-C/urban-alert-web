// Cloudflare Turnstile, renderizado explícito (spec 004-captcha-reporte, plan D-001): sin dependencias de npm.
// El script se carga una sola vez y solo cuando un formulario lo necesita (RNF-001).

export const URL_SCRIPT_TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type OpcionesWidget = {
  sitekey: string;
  action?: string;
  theme?: "auto" | "light" | "dark";
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

// Subconjunto de window.turnstile que usa el portal.
export type Turnstile = {
  render: (contenedor: HTMLElement, opciones: OpcionesWidget) => string;
  reset: (idWidget?: string) => void;
  remove: (idWidget: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let carga: Promise<Turnstile> | null = null;

export function cargarTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (carga) return carga;

  carga = new Promise<Turnstile>((resolver, rechazar) => {
    const script = document.createElement("script");
    script.src = URL_SCRIPT_TURNSTILE;
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolver(window.turnstile) : rechazar(new Error("Turnstile no quedó disponible."));
    script.onerror = () => {
      // Sin red o bloqueado: se podrá reintentar al volver a montar el formulario.
      carga = null;
      script.remove();
      rechazar(new Error("No se pudo cargar el script de verificación."));
    };
    document.head.appendChild(script);
  });
  return carga;
}

// Clave pública del widget, del build (NEXT_PUBLIC_TURNSTILE_SITE_KEY; en Provision, vars.TURNSTILE_SITE_KEY).
// Vacía: el portal no muestra la verificación (RF-007). Debe escribirse literal: Next.js la sustituye en el build.
export function claveSitioTurnstile(): string {
  return (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
}

// Solo para pruebas: olvida la carga en curso.
export function olvidarCargaTurnstile(): void {
  carga = null;
}
