// node --test infra/web/origen/index.test.mjs : lógica del origen Lambda con un bucket falso en memoria.
import assert from "node:assert/strict";
import { test } from "node:test";
import { claveDe, crearHandler } from "./index.mjs";

const objetos = {
  "index.html": { cuerpo: "<h1>inicio</h1>", contentType: "text/html", cacheControl: "public, max-age=0, must-revalidate", etag: '"a1"' },
  "mapa/index.html": { cuerpo: "<h1>mapa</h1>", contentType: "text/html", cacheControl: "public, max-age=0, must-revalidate", etag: '"b2"' },
  "historial/detalle/index.html": { cuerpo: "<h1>detalle</h1>", contentType: "text/html", etag: '"c3"' },
  "_next/static/chunks/x.js": { cuerpo: "console.log(1)", contentType: "binary/octet-stream", cacheControl: "public, max-age=31536000, immutable", etag: '"d4"' },
  "404.html": { cuerpo: "<h1>no encontrado</h1>", contentType: "text/html", cacheControl: "public, max-age=0, must-revalidate", etag: '"e5"' },
};

const lecturas = [];
async function leer(clave, { soloCabeceras, ifNoneMatch } = {}) {
  lecturas.push({ clave, soloCabeceras });
  const objeto = objetos[clave];
  if (!objeto) return { estado: 404 };
  if (ifNoneMatch && ifNoneMatch === objeto.etag) return { estado: 304, etag: objeto.etag };
  return { estado: 200, ...objeto, cuerpo: soloCabeceras ? null : new TextEncoder().encode(objeto.cuerpo) };
}

const handler = crearHandler(leer);
const evento = (rawPath, method = "GET", headers = {}) => ({ rawPath, headers, requestContext: { http: { method } } });
const texto = (r) => Buffer.from(r.body, "base64").toString("utf8");

test("claveDe resuelve índices de carpeta y rechaza rutas inválidas", () => {
  assert.equal(claveDe("/"), "index.html");
  assert.equal(claveDe("/mapa/"), "mapa/index.html");
  assert.equal(claveDe("/historial/detalle"), "historial/detalle/index.html");
  assert.equal(claveDe("/_next/static/chunks/x.js"), "_next/static/chunks/x.js");
  assert.equal(claveDe("/a%20b/"), "a b/index.html");
  assert.equal(claveDe("/../secreto.txt"), null);
  assert.equal(claveDe("/%E0%A4%A"), null);
});

test("sirve la página de una carpeta con su caché y las cabeceras de seguridad", async () => {
  const r = await handler(evento("/mapa/"));
  assert.equal(r.statusCode, 200);
  assert.equal(texto(r), "<h1>mapa</h1>");
  assert.equal(r.headers["cache-control"], "public, max-age=0, must-revalidate");
  assert.equal(r.headers["strict-transport-security"], "max-age=31536000");
  assert.equal(r.headers["x-content-type-options"], "nosniff");
  assert.equal(r.headers["x-frame-options"], "SAMEORIGIN");
  assert.equal(r.headers.etag, '"b2"');
});

test("el detalle con ?id= sirve la página del detalle (la query no forma parte de rawPath)", async () => {
  const r = await handler(evento("/historial/detalle/"));
  assert.equal(r.statusCode, 200);
  assert.equal(texto(r), "<h1>detalle</h1>");
});

test("corrige el tipo genérico de S3 por la extensión y conserva immutable", async () => {
  const r = await handler(evento("/_next/static/chunks/x.js"));
  assert.equal(r.headers["content-type"], "text/javascript; charset=utf-8");
  assert.equal(r.headers["cache-control"], "public, max-age=31536000, immutable");
});

test("una ruta inexistente devuelve 404.html con estado 404", async () => {
  const r = await handler(evento("/no-existe/"));
  assert.equal(r.statusCode, 404);
  assert.equal(texto(r), "<h1>no encontrado</h1>");
  assert.equal(r.headers.etag, undefined);
});

test("una ruta con .. devuelve 404 sin leer esa clave", async () => {
  lecturas.length = 0;
  const r = await handler(evento("/../x"));
  assert.equal(r.statusCode, 404);
  assert.deepEqual(lecturas.map((l) => l.clave), ["404.html"]);
});

test("If-None-Match igual al ETag devuelve 304 sin cuerpo", async () => {
  const r = await handler(evento("/", "GET", { "if-none-match": '"a1"' }));
  assert.equal(r.statusCode, 304);
  assert.equal(r.body, "");
  assert.equal(r.headers.etag, '"a1"');
});

test("HEAD devuelve cabeceras sin cuerpo", async () => {
  lecturas.length = 0;
  const r = await handler(evento("/", "HEAD"));
  assert.equal(r.statusCode, 200);
  assert.equal(r.body, "");
  assert.equal(lecturas[0].soloCabeceras, true);
});

test("otros métodos responden 405", async () => {
  for (const metodo of ["POST", "PUT", "DELETE"]) {
    const r = await handler(evento("/", metodo));
    assert.equal(r.statusCode, 405);
    assert.equal(r.headers.allow, "GET, HEAD");
  }
});

test("sin 404.html en el bucket responde 404 en texto plano", async () => {
  const vacio = crearHandler(async () => ({ estado: 404 }));
  const r = await vacio(evento("/x/"));
  assert.equal(r.statusCode, 404);
  assert.equal(texto(r), "Not Found");
});
