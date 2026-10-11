import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// En AWS el sitio es estático (S3 + CloudFront) y el navegador llama directamente al API Gateway
// compartido: su URL llega en el build como NEXT_PUBLIC_API_URL (spec 001-migracion-aws, plan D-001/D-002).
//
// En `next dev`, sin NEXT_PUBLIC_API_URL, el navegador llama a /api/v1/... en el mismo origen y estos rewrites
// reenvían Reportes, Usuarios y la consulta del mapa a cada servicio local, así no hace falta CORS. Con `output: "export"` Next rechaza los rewrites incluso en
// `next dev`, por eso la configuración depende de la fase (plan D-004).
const reportesApiUrl = process.env.REPORTES_API_URL ?? "http://localhost:5039";
const usuariosApiUrl = process.env.USUARIOS_API_URL ?? "http://localhost:8081";
const geoespacialApiUrl = process.env.GEOESPACIAL_API_URL ?? "http://localhost:8000";

// Sin trailingSlash: añadiría una redirección 308 a /api/v1/.../ antes de aplicar los rewrites.
const desarrollo: NextConfig = {
  rewrites() {
    return Promise.resolve([
      {
        source: "/api/v1/reportes/:path*",
        destination: `${reportesApiUrl}/api/v1/Reportes/:path*`,
      },
      {
        source: "/api/v1/usuarios/:path*",
        destination: `${usuariosApiUrl}/api/v1/users/:path*`,
      },
      // Solo la consulta del mapa, igual que el gateway (los clientes no escriben en Geoespacial).
      {
        source: "/api/v1/geoespacial/reports",
        destination: `${geoespacialApiUrl}/api/v1/geospatial/reports`,
      },
    ]);
  },
};

const exportacion: NextConfig = {
  // `next build` genera out/ con un index.html por ruta (/mapa/ → mapa/index.html), que S3 sirve tal cual.
  output: "export",
  trailingSlash: true,
};

export default function configuracion(phase: string): NextConfig {
  return phase === PHASE_DEVELOPMENT_SERVER ? desarrollo : exportacion;
}
