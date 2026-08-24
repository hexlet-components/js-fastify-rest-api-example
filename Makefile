test:
	pnpm test

test-coverage:
	pnpm exec vitest run --coverage

dev:
	pnpm run dev

check-types:
	pnpm exec tsc

# ncu, а не npx: пакет стоит в devDependencies, и npx при его отсутствии молча
# тянул бы из сети другую версию. Обычно обновления приносит dependabot — цель
# нужна, когда хочется обновиться сразу и локально.
deps-update:
	pnpm exec ncu -u

# Таблица маршрутов целиком: их регистрирует glue по спеке, отдельного файла
# с маршрутами нет — печатать нужно приложение. Поэтому цели нужен .env: без
# JWT_SECRET приложение не поднимается, как и на make dev.
routes:
	pnpm exec fastify print-routes src/app.ts

migration-generate:
	pnpm exec drizzle-kit generate

# Схема без миграции — молчаливая поломка: код ждёт колонку, которой в базе не
# появится. Цель ловит это, перегенерировав и проверив, что ничего нового не
# возникло. В generate-check миграции не входят намеренно: там речь про
# сгенерированное из спеки, а миграцию автор создаёт осознанно.
#
# check вызывается флагами, а не через конфиг: читая drizzle.config.ts, он
# принимает dialect за параметр AWS Data API и падает (drizzle-kit 0.31).
migration-check:
	pnpm exec drizzle-kit check --dialect postgresql --out ./drizzle
	pnpm exec drizzle-kit generate
	@test -z "$$(git status --porcelain drizzle)" || { \
		echo "Схема изменилась без миграции — запустите make migration-generate:"; \
		git status --porcelain drizzle; \
		exit 1; \
	}

lint:
	pnpm --silent run lint
	pnpm exec tsc
	pnpm --silent run format:check
	$(MAKE) lint-openapi

# Линт контракта: правила и причины отключений — в redocly.yaml. Гоняется по
# сгенерированному, а не по main.tsp: проверять надо то, что видит клиент.
lint-openapi:
	pnpm exec redocly lint tsp-output/@typespec/openapi3/openapi.v1.json

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
	git diff --exit-code -- tsp-output src/types/handlers

# Проверка собранного образа: см. комментарий в самом скрипте.
smoke-test:
	./scripts/smoke-test.sh

# Контрактные тесты поверх спеки: см. комментарий в самом скрипте.
contract-test:
	./scripts/contract-test.sh

mock:
	pnpm exec prism mock ./tsp-output/@typespec/openapi3/openapi.v1.json

install:
	pnpm install

# Первичная настройка: зависимости и .env из шаблона.
setup: install env

# cp -n не затирает существующий .env; || true — при существующей цели он
# возвращает 1 на BSD. JWT_SECRET в шаблоне пустой, вписывается руками.
env:
	cp -n .env.example .env || true

.PHONY: install setup env test dev check-types deps-update routes migration-generate \
	lint lint-fix generate-openapi generate-openapi-ts-types generate-types \
	generate-check migration-check mock test-coverage lint-openapi contract-test smoke-test
