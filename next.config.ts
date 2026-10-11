import type { NextConfig } from "next";

// El navegador llama a /api/v1/reportes/..., /api/v1/usuarios/... y a la consulta de cercanía
// de Geoespacial (/api/v1/geoespacial/reports) en el mismo origen.
// Con el compose, el gateway atiende esas rutas antes de llegar aquí. Sin gateway
// (npm run dev), estos rewrites las reenvían directo a cada servicio, así no hace falta
// CORS. Se lee en `next build`.
const reportesApiUrl = process.env.REPORTES_API_URL ?? "http://localhost:5039";
const usuariosApiUrl = process.env.USUARIOS_API_URL ?? "http://localhost:8081";
const geoespacialApiUrl = process.env.GEOESPACIAL_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // Imagen de Docker mínima: .next/standalone incluye server.js y solo los módulos necesarios.
  output: "standalone",
  rewrites() {
    return [
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
    ];
  },
};

export default nextConfig;
