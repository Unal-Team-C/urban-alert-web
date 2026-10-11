// node --test infra/web/funciones/indice.test.mjs : la función no es un módulo (así la exige CloudFront), se evalúa su texto.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const codigo = readFileSync(new URL("./indice.js", import.meta.url), "utf8");
const handler = new Function(`${codigo}\nreturn handler;`)();

function uriFinal(uri, querystring = {}) {
  return handler({ request: { method: "GET", uri, querystring, headers: {} } }).uri;
}

test("la raíz sirve index.html", () => {
  assert.equal(uriFinal("/"), "/index.html");
});

test("una carpeta con barra final sirve su index.html", () => {
  assert.equal(uriFinal("/mapa/"), "/mapa/index.html");
  assert.equal(uriFinal("/reportes/nuevo/"), "/reportes/nuevo/index.html");
});

test("una ruta sin barra final ni extensión sirve su index.html", () => {
  assert.equal(uriFinal("/historial"), "/historial/index.html");
  assert.equal(uriFinal("/historial/detalle"), "/historial/detalle/index.html");
});

test("el detalle con ?id= conserva la query aparte", () => {
  const querystring = { id: { value: "abc" } };
  const request = handler({ request: { method: "GET", uri: "/historial/detalle/", querystring, headers: {} } });
  assert.equal(request.uri, "/historial/detalle/index.html");
  assert.deepEqual(request.querystring, querystring);
});

test("los archivos con extensión no cambian", () => {
  for (const uri of ["/_next/static/chunks/abc.js", "/favicon.ico", "/404.html", "/localidades.geojson", "/mapa/index.txt"]) {
    assert.equal(uriFinal(uri), uri);
  }
});
