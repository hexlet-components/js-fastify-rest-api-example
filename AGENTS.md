# Repository Guidelines

## Project Structure & Module Organization

- `src/app.ts`: Fastify entry; автозагружает `src/plugins/`, а маршруты регистрирует
  `fastify-openapi-glue` по спеке. Здесь же обработчик ошибок (RFC 9457) и
  securityHandlers.
- `main.tsp`, `tsp-output/`: контракт на TypeSpec и сгенерированный из него
  OpenAPI. Источник истины для всего остального.
- `src/types/handlers/v1/`, `src/types/handlers/v2/`: сгенерированное из
  OpenAPI — типы обработчиков, zod-схемы и клиент, по одному набору на версию.
  Руками не правится.
- `src/routes/`: обработчики; `src/routes/index.ts` собирает v1, а
  `src/routes/v2/index.ts` — v2. Тип полный, поэтому забытая операция — ошибка
  компиляции.
- `src/plugins/`: конфиг (`env`), база, JWT, security-плагины, документация.
- `src/db/`: схема Drizzle, сиды и публичные проекции; `drizzle/` — миграции (на корне, по соглашению drizzle).
- `src/validators/`, `src/rules/`, `src/policies/`: бизнес-валидация, правила уровня базы,
  права доступа.
- `src/lib/`: утилиты, хеширование паролей, фабрики тестовых данных.
- `test/`: спеки; бутстрап в `test/helper.ts`. На корне, а не в `src/`, —
  так же, как у генератора fastify.
- `scripts/`: contract-test.sh и smoke-test.sh.
- `Dockerfile`, `compose.yaml`: образ без шага сборки — node 26 исполняет
  TypeScript сам. Сиды в `NODE_ENV=production` не применяются: они тянут
  `@faker-js/faker` из devDependencies, и в бою фикстурам не место.

Исходники лежат в `src/`, как их раскладывает `fastify generate --lang=ts`.
Контракт (`main.tsp`, `tsp-output/`) остаётся на корне: генератор про него не
знает, и это не исходный код, а артефакт.

## Development, Test, and Check Commands

- `make setup` — зависимости и `.env` из шаблона; существующий `.env` не
  трогается. Значения в шаблоне рабочие, для дева и тестов ничего вписывать не
  надо.
- `make install` — только зависимости.
- `make dev` — запуск с перезагрузкой на http://localhost:3000. Требует `.env`,
  как и `make routes`.
- `make test` / `make test-coverage` — vitest, второй с порогами покрытия.
- `make lint` / `make lint-fix` — oxlint, tsc, формат и линт спеки.
- `make generate-types` — OpenAPI из TypeSpec и всё сгенерированное из него.
- `make generate-check` — сгенерированное не разошлось со спекой.
- `make migration-generate` / `make migration-check` — миграции и проверка, что
  схема не менялась без миграции.
- `make contract-test` — schemathesis по спеке (нужен uv).
- `make smoke-test` — собирает образ и проверяет его (нужен docker).
- `make mock` — мок-сервер по OpenAPI.

## Coding Style & Naming Conventions

- **Модули**: ESM (`type: module`), TypeScript, импорты с расширением `.ts`.
- **Формат**: oxfmt, линт oxlint. `make lint` перед коммитом; lefthook гоняет
  формат и линт по staged-файлам автоматически.
- **Контракт первичен**: новое поле, статус или операция сначала появляются в
  `main.tsp`, потом `make generate-types`, потом код. Обратный порядок ловится
  в CI.

## Версии

v1 отдаётся с корня, v2 — с префиксом `/v2`. v1 намеренно не уехал под `/v1`:
пути внутри документа OpenAPI префикса не знают, и переезд сделал бы
`/openapi.json` неправдой.

Версии различаются полем `phone` у `User` (`@added(Versions.v2)`): в v2 оно
читается и принимается на запись, в v1 его нет. Удерживают это разные проекции
в `src/db/projections.ts`. Это второй слой: ответ и так пишется строго по схеме
операции, поэтому поле вне контракта в тело не попадёт, — но проекция не даёт
секрету покинуть базу, если у маршрута однажды не окажется схемы. Курсы, уроки и токены между версиями не
менялись и переиспользуют одни обработчики.

`make contract-test` гоняет обе версии.

## Testing Guidelines

- **Фреймворк**: vitest. Спеки в `test/**/*.test.ts`.
- **Клиент**: корректные запросы — через сгенерированный клиент
  (`buildClient()`), нарушающие контракт — через `app.inject()` (`build()`):
  клиент типизирован по спеке и выразить их не даёт.
- **Покрытие**: пороги в `vitest.config.ts`, проверяются в CI.
- **Контрактные тесты**: `make contract-test` генерирует запросы из OpenAPI —
  им найдены почти все 5xx, которые здесь исправлены.

## Commit & Pull Request Guidelines

- **Коммиты**: conventional commits.
- **PR**: заголовок обязан быть conventional commit — по нему release-please
  определяет разряд версии (проверяется в `pr-title.yml`).

## Security & Configuration Tips

- **Секреты**: конфиг проверяется схемой в `src/plugins/env.ts`. Без
  `JWT_SECRET` от 32 символов приложение не поднимается. `.env` не коммитится, а
  секрет из `.env.example` годится только для дева: он лежит в публичном
  репозитории, в прод подставляется свой через окружение.
- **Наблюдаемость**: `/health` и `/metrics` вне контракта — это не часть API.
  Трассировка (`src/telemetry.ts`) поднимается только при заданном
  `OTEL_EXPORTER_OTLP_ENDPOINT` и грузится через `--import` в `start`/`dev`,
  раньше приложения: иначе инструментация http не успеет подменить модуль.
- **Тесты не читают `.env`**: `dotenv` в `src/plugins/env.ts` отключён при
  `NODE_ENV=test`, переменные приходят из `vitest.config.ts`. Иначе прогон
  зависел бы от локального файла разработчика.
- **База**: PGlite (`src/plugins/drizzle.ts`) — postgres в wasm, внутри процесса
  и в памяти, пересоздаётся при каждом запуске. Взят ради нативных типов:
  `timestamptz` в схеме это время, а не integer с кодеком поверх. Для
  постоянного хранения нужен каталог данных или отдельный сервер postgres.
