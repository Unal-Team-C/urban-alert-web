// CloudFront Function (cloudfront-js-2.0, viewer-request). S3 con Origin Access Control no resuelve índices de
// carpeta: la exportación de Next.js (trailingSlash) genera /mapa/index.html y el navegador pide /mapa/ o /mapa.
// La query string no forma parte de event.request.uri, así que /historial/detalle/?id=… se resuelve igual.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- CloudFront invoca handler por nombre.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith("/")) {
    request.uri = uri + "index.html";
  } else if (uri.split("/").pop().indexOf(".") === -1) {
    request.uri = uri + "/index.html";
  }
  return request;
}
