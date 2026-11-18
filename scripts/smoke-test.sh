#!/usr/bin/env bash
set -euo pipefail
project="${SMOKE_PROJECT:-js-rest-smoke}"
cleanup() {
  docker compose -p "$project" --profile app logs --tail 30 api || true
  docker compose -p "$project" --profile app down --volumes
}
trap cleanup EXIT
# Порт БД основного примера не занимается, для smoke используются внутренние адреса Compose.
config=$(mktemp)
trap 'rm -f "$config"; cleanup' EXIT
cat >"$config" <<'YAML'
services:
  db:
    ports: !reset []
  api:
    ports: !reset []
YAML
docker compose -p "$project" -f compose.yaml -f "$config" --profile app up --build --wait
for path in /health /courses /openapi.json /docs; do
  docker compose -p "$project" exec -T api node -e "fetch('http://127.0.0.1:3000$path').then(r=>{if(r.status!==200)throw new Error(String(r.status));console.log('$path -> '+r.status)})"
done
docker compose -p "$project" exec -T api node -e "fetch('http://127.0.0.1:3000/me').then(r=>{if(r.status!==401)throw new Error(String(r.status));console.log('/me -> 401')})"
docker compose -p "$project" exec -T api node -e "fetch('http://127.0.0.1:3000/courses').then(r=>r.json()).then(v=>{if(v.data.length!==0)throw new Error('Production must not seed courses');console.log('production data empty')})"
