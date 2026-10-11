#!/usr/bin/env bash
# Read-only smoke test of the published site (spec RF-009, RNF-001).
# - Every page answers 200 (folder index), a missing route answers 404.
# - The JavaScript of the site calls the gateway URL read from SSM (RF-003).
# - HTML is revalidated on every visit and content-hashed assets are immutable (skipped with --sin-cabeceras,
#   for a local server that does not set Cache-Control).
# A new distribution may take a few minutes to answer: the first request is retried for up to 5 minutes.
# Usage: scripts/smoke-web.sh <site-url> <api-url> [--sin-cabeceras]
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <site-url> <api-url> [--sin-cabeceras]" >&2
  exit 2
fi
SITE="${1%/}"
API="${2%/}"
CHECK_HEADERS=true
[[ "${3:-}" == "--sin-cabeceras" ]] && CHECK_HEADERS=false
RETRIES="${SMOKE_RETRIES:-30}"
failures=0

status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

ok() { echo "ok    $*"; }
fail() {
  echo "FALLO $*" >&2
  failures=$((failures + 1))
}

attempt=1
until [[ "$(status "$SITE/")" == "200" ]]; do
  if [[ $attempt -ge $RETRIES ]]; then
    echo "::error::$SITE/ no responde 200 tras $RETRIES intentos." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 10
done

for path in "/" "/mapa/" "/historial/" "/historial/detalle/?id=smoke" "/historial/detalle?id=smoke" "/reportes/nuevo/" "/mapa"; do
  code=$(status "$SITE$path")
  if [[ "$code" == "200" ]]; then ok "GET $path → 200"; else fail "GET $path → $code (esperado 200)"; fi
done

code=$(status "$SITE/no-existe-smoke/")
if [[ "$code" == "404" ]]; then ok "GET /no-existe-smoke/ → 404"; else fail "GET /no-existe-smoke/ → $code (esperado 404)"; fi

# The gateway URL is inlined in the chunks of the pages that call the API.
found=false
for page in "/historial/" "/reportes/nuevo/" "/mapa/"; do
  for script in $(curl -s "$SITE$page" | grep -o '/_next/static/[^"]*\.js' | sort -u); do
    if curl -s "$SITE$script" | grep -qF "$API"; then
      found=true
      break 2
    fi
  done
done
if $found; then ok "el JavaScript llama a $API"; else fail "ningún JavaScript del sitio contiene $API"; fi

if $CHECK_HEADERS; then
  html_cache=$(curl -s -o /dev/null -D - "$SITE/" | tr -d '\r' | grep -i '^cache-control:' || true)
  if [[ "$html_cache" == *"max-age=0"* ]]; then ok "HTML: $html_cache"; else fail "HTML sin max-age=0 ($html_cache)"; fi

  asset=$(curl -s "$SITE/" | grep -o '/_next/static/[^"]*\.js' | head -1)
  asset_cache=$(curl -s -o /dev/null -D - "$SITE$asset" | tr -d '\r' | grep -i '^cache-control:' || true)
  if [[ "$asset_cache" == *"immutable"* ]]; then ok "$asset: $asset_cache"; else fail "$asset sin immutable ($asset_cache)"; fi
fi

if [[ $failures -gt 0 ]]; then
  echo "::error::Prueba de humo: $failures fallo(s)." >&2
  exit 1
fi
echo "Prueba de humo superada: $SITE"
