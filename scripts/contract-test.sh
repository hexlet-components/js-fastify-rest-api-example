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
# Шеддинг под нагрузкой мешает так же, как лимитер: schemathesis шлёт сотни
# запросов подряд и упирается в 503, а не в поведение API. Ноль, а не заведомо
# большой порог: под нагрузкой гистограмма monitorEventLoopDelay возвращает
# mean = Infinity, и любое конечное значение оказывается меньше. Ноль
# under-pressure понимает как «проверку не делать вовсе».
export MAX_EVENT_LOOP_DELAY=0
export MAX_EVENT_LOOP_UTILIZATION=0

# Порт проверяется до запуска: если на нём кто-то уже слушает, прогон уходил в
# чужой процесс и зеленел, ничего не проверив в текущем коде. Молчаливое ложное
# зелёное хуже падения.
if curl -sf "$BASE/openapi.json" >/dev/null 2>&1; then
  echo "порт $PORT уже занят — прогон пошёл бы против чужого процесса." >&2
  echo "освободите порт или задайте другой: PORT=3211 make contract-test" >&2
  exit 1
fi

LOG=$(mktemp)
pnpm exec fastify start -l error -p "$PORT" --plugin-timeout 60000 src/app.ts >"$LOG" 2>&1 &
APP_PID=$!
trap 'kill "$APP_PID" 2>/dev/null || true; rm -f "$LOG"' EXIT

# Без этой проверки не поднявшееся приложение давало голый exit 2 из-под
# `set -e` на следующей команде — искать причину было негде. Чаще всего порт
# занят предыдущим прогоном.
for _ in $(seq 1 60); do
  if curl -sf "$BASE/openapi.json" >/dev/null 2>&1; then break; fi
  sleep 1
done
if ! curl -sf "$BASE/openapi.json" >/dev/null 2>&1; then
  echo "приложение не поднялось на $BASE за 60 с. Лог:" >&2
  cat "$LOG" >&2
  exit 1
fi

# Пользователь из сидов (db/seeds.ts) с паролем по умолчанию из lib/data.ts.
# Токен нужен, чтобы проверялись и защищённые операции, а не только 401 на них.
TOKEN=$(
  curl -sf -X POST "$BASE/tokens" \
    -H 'content-type: application/json' \
    -d '{"email":"support@hexlet.io","password":"correct-horse-battery-staple"}' |
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).token))'
) || { echo "не удалось получить токен — сиды или пароль разошлись с db/seeds.ts" >&2; exit 1; }

CHECKS=not_a_server_error,ignored_auth,status_code_conformance,content_type_conformance,response_schema_conformance

# Обе версии: v2 отличается от v1 полем phone у User, и без отдельного прогона
# он остался бы непроверенным. Документ v2 несёт servers с префиксом, поэтому
# --url указывает туда же.
for version in v1 v2; do
  if [ "$version" = "v1" ]; then
    document="$BASE/openapi.json"
    target="$BASE"
  else
    document="$BASE/v2/openapi.json"
    target="$BASE/v2"
  fi

  echo "== контрактные тесты $version =="
  uvx --from schemathesis st run "$document" \
    --url "$target" \
    -H "Authorization: Bearer $TOKEN" \
    -c "$CHECKS" \
    --max-examples "$EXAMPLES"
done
