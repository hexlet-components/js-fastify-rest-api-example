test:
	pnpm test

dev:
	pnpm run dev

check-types:
	pnpm exec tsc

deps-update:
	npx ncu -u

# Таблица маршрутов целиком: их регистрирует glue по спеке, отдельного файла
# с маршрутами нет — печатать нужно приложение.
routes:
	pnpm exec fastify print-routes app.ts

migration-generate:
	pnpm exec drizzle-kit generate

lint:
	pnpm --silent run lint
	pnpm exec tsc
	pnpm --silent run format:check

lint-fix:
	pnpm --silent run lint:fix

generate-openapi:
	pnpm exec tsp compile .

generate-openapi-ts-types:
# 	# pnpm exec openapi-box ./tsp-output/@typespec/openapi3/openapi.v1.json
	# pnpm exec openapi-typescript ./tsp-output/@typespec/openapi3/openapi.v1.json -o types/openapi.ts
	pnpm exec openapi-ts

# Форматтер обязателен последним шагом: генератор пишет в своём стиле, и без
# него `make lint` падает на сгенерированных файлах после каждой генерации.
generate-types: generate-openapi generate-openapi-ts-types
	pnpm --silent run format

# Проверка, что сгенерированное закоммичено: перегенерируем и падаем, если
# рабочее дерево изменилось. Ловит и забытый коммит, и сломанный генератор —
# без этой цели поломка видна только тому, кто запустит генерацию руками.
# Миграции drizzle сюда не входят намеренно: их автор создаёт осознанно.
generate-check: generate-types
	git diff --exit-code -- tsp-output types/handlers

mock:
	pnpm exec prism mock ./tsp-output/@typespec/openapi3/openapi.v1.json

install:
	pnpm install

.PHONY: install test dev check-types deps-update routes migration-generate \
	lint lint-fix generate-openapi generate-openapi-ts-types generate-types \
	generate-check mock
