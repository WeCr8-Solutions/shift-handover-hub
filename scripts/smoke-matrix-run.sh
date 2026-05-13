#!/usr/bin/env bash
set -euo pipefail

# smoke-matrix-run.sh
# Single command to run the full smoke matrix end-to-end.
#
# Usage:
#   ./scripts/smoke-matrix-run.sh [target]
#
# Targets:
#   live      → joblineai.lovable.app  (default)
#   preview   → id-preview Lovable URL
#   local     → http://localhost:8080
#
# Required env vars (all targets):
#   E2E_SEED_SECRET       — token for the seed-e2e edge function
#   E2E_ADMIN_PASSWORD    — seeded admin user password
#   E2E_OPERATOR_PASSWORD — seeded operator user password
#
# Optional env vars:
#   CHROMIUM_BIN          — override Chromium path
#   E2E_SMOKE_ROLES       — default: operator,supervisor
#   E2E_SMOKE_PATHWAYS    — default: all pathways
#   E2E_SMOKE_SCENARIO    — default: wo_basic
#   WORKERS               — default: 1

TARGET="${1:-live}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$TARGET" in
  live|production|prod)
    export E2E_BASE_URL="${E2E_BASE_URL:-https://joblineai.lovable.app}"
    export E2E_SUPABASE_URL="${E2E_SUPABASE_URL:-https://dpajcbhfwmfnzgldrveu.supabase.co}"
    echo "▶ Target: LIVE  ($E2E_BASE_URL)"
    ;;
  preview|test|staging)
    export E2E_BASE_URL="${E2E_BASE_URL:-https://id-preview--059e6965-215c-439a-949e-fcc8a2e6d939.lovable.app}"
    export E2E_SUPABASE_URL="${E2E_SUPABASE_URL:-https://kgrstnbxqdmadtoankqr.supabase.co}"
    echo "▶ Target: PREVIEW  ($E2E_BASE_URL)"
    ;;
  local|dev)
    export E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:8080}"
    export E2E_SUPABASE_URL="${E2E_SUPABASE_URL:-https://kgrstnbxqdmadtoankqr.supabase.co}"
    echo "▶ Target: LOCAL  ($E2E_BASE_URL)"
    ;;
  *)
    echo "Unknown target: $TARGET"
    echo "Usage: $0 [live|preview|local]"
    exit 1
    ;;
esac

# Validate required secrets
missing=0
for var in E2E_SEED_SECRET E2E_ADMIN_PASSWORD E2E_OPERATOR_PASSWORD; do
  if [[ -z "${!var:-}" ]]; then
    echo "✗ Missing env var: $var"
    missing=1
  fi
done
[[ "$missing" -eq 1 ]] && exit 1

echo "▶ Supabase: $E2E_SUPABASE_URL"
echo "▶ Roles:    ${E2E_SMOKE_ROLES:-operator,supervisor}"
echo "▶ Pathways: ${E2E_SMOKE_PATHWAYS:-wo,handoff,ncr,quarantine,notifications,nav,talent,billing,admin,routing}"
echo ""

# Drop the target arg ($1) so it isn't re-passed to playwright as a test filter
shift || true

# Run the full matrix with serial workers (shared seed context)
exec npx playwright test "$SCRIPT_DIR/../e2e/smoke-matrix.spec.ts" \
  --workers="${WORKERS:-1}" \
  --reporter=line \
  "$@"
