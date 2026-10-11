#!/usr/bin/env bash
# Uploads the static export to the site bucket and invalidates the CloudFront cache (spec RF-008, RNF-001; plan D-007).
# 1. _next/static/ (content-hashed names): cached for a year, never deleted, so open tabs keep working.
# 2. Everything else (HTML, RSC payloads, public/): revalidated on every visit; files gone from the build are deleted.
# 3. Invalidation of /* and wait until the edges serve the new version. Skipped with an empty distribution ID:
#    the Lambda origin (plan D-012) has no edge cache.
# Usage: scripts/publicar-sitio.sh <out-dir> <bucket> <distribution-id | "">
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Usage: $0 <out-dir> <bucket> <distribution-id | \"\">" >&2
  exit 2
fi
OUT="${1%/}"
BUCKET="$2"
DISTRIBUTION="$3"

if [[ ! -f "$OUT/index.html" || ! -f "$OUT/404.html" || ! -d "$OUT/_next/static" ]]; then
  echo "::error::$OUT no parece una exportación de Next.js (faltan index.html, 404.html o _next/static)." >&2
  exit 1
fi

aws s3 sync "$OUT/_next/static" "s3://$BUCKET/_next/static" \
  --cache-control "public, max-age=31536000, immutable" --only-show-errors

aws s3 sync "$OUT" "s3://$BUCKET" --delete --exclude "_next/static/*" \
  --cache-control "public, max-age=0, must-revalidate" --only-show-errors

if [[ -z "$DISTRIBUTION" ]]; then
  echo "Sitio publicado en s3://$BUCKET (sin CloudFront: no hay caché que invalidar)."
  exit 0
fi

invalidation=$(aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*" \
  --query Invalidation.Id --output text)
echo "Invalidación $invalidation en curso..."
aws cloudfront wait invalidation-completed --distribution-id "$DISTRIBUTION" --id "$invalidation"
echo "Sitio publicado en s3://$BUCKET (invalidación $invalidation completada)."
