// Origen temporal del sitio mientras CloudFront está bloqueado (spec 001-migracion-aws, plan D-012).
// Lambda function URL (payload 2.0) que sirve la exportación estática desde el bucket privado, con la misma
// resolución de índices que funciones/indice.js y las cabeceras de la política gestionada de CloudFront.
// El SDK de AWS lo trae el runtime nodejs22.x; se importa solo al invocar el handler real (las pruebas no lo usan).

const CABECERAS_SEGURIDAD = {
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "SAMEORIGIN",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-xss-protection": "1; mode=block",
};

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".geojson": "application/geo+json",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// /mapa/ → mapa/index.html; /mapa → mapa/index.html; /_next/x.js → _next/x.js. null si la ruta no es válida.
export function claveDe(rawPath) {
  let ruta;
  try {
    ruta = decodeURIComponent(rawPath || "/");
  } catch {
    return null;
  }
  if (!ruta.startsWith("/") || ruta.split("/").includes("..")) return null;
  if (ruta.endsWith("/")) ruta += "index.html";
  else if (!ruta.split("/").pop().includes(".")) ruta += "/index.html";
  return ruta.slice(1);
}

function tipoDe(clave, contentType) {
  if (contentType && contentType !== "binary/octet-stream" && contentType !== "application/octet-stream") {
    return contentType;
  }
  const punto = clave.lastIndexOf(".");
  return TIPOS[punto === -1 ? "" : clave.slice(punto)] ?? "application/octet-stream";
}

function respuesta(statusCode, cabeceras, cuerpo, soloCabeceras) {
  return {
    statusCode,
    headers: { ...CABECERAS_SEGURIDAD, ...cabeceras },
    body: cuerpo && !soloCabeceras ? Buffer.from(cuerpo).toString("base64") : "",
    isBase64Encoded: true,
  };
}

// leer(clave, { soloCabeceras, ifNoneMatch }) → { estado: 200 | 304 | 404, cuerpo?, contentType?, cacheControl?, etag? }
export function crearHandler(leer) {
  return async function handler(event) {
    const metodo = event?.requestContext?.http?.method ?? "GET";
    if (metodo !== "GET" && metodo !== "HEAD") {
      return respuesta(405, { allow: "GET, HEAD", "content-type": "text/plain; charset=utf-8" }, "Method Not Allowed");
    }
    const soloCabeceras = metodo === "HEAD";
    const ifNoneMatch = event?.headers?.["if-none-match"];

    const clave = claveDe(event?.rawPath);
    let objeto = clave ? await leer(clave, { soloCabeceras, ifNoneMatch }) : { estado: 404 };

    if (objeto.estado === 304) {
      return respuesta(304, { etag: objeto.etag ?? ifNoneMatch, "cache-control": objeto.cacheControl ?? "" }, null, true);
    }

    let estado = 200;
    let claveServida = clave;
    if (objeto.estado === 404) {
      estado = 404;
      claveServida = "404.html";
      objeto = await leer(claveServida, { soloCabeceras });
      if (objeto.estado !== 200) {
        return respuesta(404, { "content-type": "text/plain; charset=utf-8" }, "Not Found", soloCabeceras);
      }
    }

    const cabeceras = { "content-type": tipoDe(claveServida, objeto.contentType) };
    if (objeto.cacheControl) cabeceras["cache-control"] = objeto.cacheControl;
    if (objeto.etag && estado === 200) cabeceras.etag = objeto.etag;
    return respuesta(estado, cabeceras, objeto.cuerpo, soloCabeceras);
  };
}

// Adaptador real: S3 sin s3:ListBucket responde 403 a una clave inexistente; 403 y 404 se tratan igual.
async function crearLectorS3(bucket) {
  const { S3Client, GetObjectCommand, HeadObjectCommand } = await import("@aws-sdk/client-s3");
  const s3 = new S3Client({});
  return async function leer(clave, { soloCabeceras, ifNoneMatch } = {}) {
    const parametros = { Bucket: bucket, Key: clave, IfNoneMatch: ifNoneMatch };
    try {
      const salida = await s3.send(soloCabeceras ? new HeadObjectCommand(parametros) : new GetObjectCommand(parametros));
      return {
        estado: 200,
        cuerpo: soloCabeceras ? null : await salida.Body.transformToByteArray(),
        contentType: salida.ContentType,
        cacheControl: salida.CacheControl,
        etag: salida.ETag,
      };
    } catch (error) {
      const codigo = error?.$metadata?.httpStatusCode;
      if (codigo === 304) return { estado: 304, etag: ifNoneMatch };
      if (codigo === 403 || codigo === 404) return { estado: 404 };
      throw error;
    }
  };
}

let handlerReal;
export async function handler(event) {
  handlerReal ??= crearHandler(await crearLectorS3(process.env.BUCKET));
  return handlerReal(event);
}
