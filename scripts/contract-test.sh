#!/usr/bin/env bash
# Контрактные тесты: schemathesis сам генерирует запросы из OpenAPI и сверяет
# ответы со спекой. Ловит то, что не ловят ни tsc, ни валидаторы fastify:
# незадокументированные статусы, 5xx на краевых входах и неприменённую
# авторизацию (ignored_auth дёргает защищённые операции без токена).
#
# Требует uv: https://docs.astral.sh/uv/
set -euo pipefail

PORT="${PORT:-3210}"
BASE="http://127.0.0.1:${PORT}"
EXAMPLES="${SCHEMATHESIS_EXAMPLES:-20}"

export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
# Лимитер в контрактном прогоне только мешает: schemathesis шлёт сотни запросов
# подряд и упирается в него, а не в поведение API.
export RATE_LIMIT_MAX=1000000

pnpm exec fastify start -l error -p "$PORT" app.ts &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 60); do
  if curl -sf "$BASE/openapi.json" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -sf "$BASE/openapi.json" >/dev/null

# Пользователь из сидов (db/seeds.ts) с паролем по умолчанию из lib/data.ts.
# Токен нужен, чтобы проверялись и защищённые операции, а не только 401 на них.
TOKEN=$(
  curl -sf -X POST "$BASE/tokens" \
    -H 'content-type: application/json' \
    -d '{"email":"support@hexlet.io","password":"correct-horse-battery-staple"}' |
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token))'
)

uvx --from schemathesis st run "$BASE/openapi.json" \
  --url "$BASE" \
  -H "Authorization: Bearer $TOKEN" \
  -c not_a_server_error,ignored_auth,status_code_conformance,content_type_conformance,response_schema_conformance \
  --max-examples "$EXAMPLES"
