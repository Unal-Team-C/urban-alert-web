#!/usr/bin/env bash
# Fails before anything is changed when the shared platform (Unal-Team-C/urban-alert-plataforma) is not
# provisioned, and prints the gateway URL the site must call (spec 001-migracion-aws RF-003, RF-008).
# The frontend only needs api-endpoint from the platform contract.
# Usage: scripts/check-platform.sh            (needs AWS credentials; the AWS CLI reads AWS_REGION)
set -euo pipefail

PARAMETER="${PLATFORM_SSM_PREFIX:-/urban-alert/plataforma/}api-endpoint"

if ! endpoint=$(aws ssm get-parameter --name "$PARAMETER" --query Parameter.Value --output text 2>/dev/null) \
  || [[ -z "$endpoint" || "$endpoint" == "None" ]]; then
  echo "::error::La plataforma compartida no está aprovisionada (urban-alert-plataforma): falta ${PARAMETER}" >&2
  echo "Aprovisiona primero la plataforma (workflow Provision de Unal-Team-C/urban-alert-plataforma)." >&2
  exit 1
fi

if [[ "$endpoint" != https://* ]]; then
  echo "::error::${PARAMETER} no es una URL HTTPS: ${endpoint}" >&2
  exit 1
fi

echo "${endpoint%/}"
