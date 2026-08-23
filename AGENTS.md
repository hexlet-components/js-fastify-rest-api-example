# Repository Guidelines

## Project Structure & Module Organization

- `app.ts`: Fastify entry; автозагружает `plugins/`, а маршруты регистрирует
  `fastify-openapi-glue` по спеке. Здесь же обработчик ошибок (RFC 9457) и
  securityHandlers.
- `main.tsp`, `tsp-output/`: контракт на TypeSpec и сгенерированный из него
  OpenAPI. Источник истины для всего остального.
- `types/handlers/`: сгенерированное из OpenAPI — типы обработчиков, zod-схемы
  и клиент. Руками не правится.
- `routes/`: обработчики; `routes/index.ts` собирает их в полный
  `RouteHandlers`, поэтому забытая операция — ошибка компиляции.
- `plugins/`: конфиг (`env`), база, JWT, security-плагины, документация.
- `db/`: схема Drizzle, сиды и публичные проекции; `drizzle/` — миграции.
- `validators/`, `rules/`, `policies/`: бизнес-валидация, правила уровня базы,
  права доступа.
- `lib/`: утилиты, хеширование паролей, фабрики тестовых данных.
- `test/`: спеки; бутстрап в `test/helper.ts`.
- `scripts/`: contract-test.sh.

## Build, Test, and Development Commands

- `make install` — установка.
- `make dev` — запуск с перезагрузкой на http://localhost:3000. Требует `.env`
  (см. `.env.example`).
- `make test` / `make test-coverage` — vitest, второй с порогами покрытия.
- `make lint` / `make lint-fix` — oxlint, tsc, формат и линт спеки.
- `make generate-types` — OpenAPI из TypeSpec и всё сгенерированное из него.
- `make generate-check` — сгенерированное не разошлось со спекой.
- `make migration-generate` / `make migration-check` — миграции и проверка, что
  схема не менялась без миграции.
- `make contract-test` — schemathesis по спеке (нужен uv).
- `make mock` — мок-сервер по OpenAPI.

## Coding Style & Naming Conventions

- **Модули**: ESM (`type: module`), TypeScript, импорты с расширением `.ts`.
- **Формат**: oxfmt, линт oxlint. `make lint` перед коммитом; lefthook гоняет
  формат и линт по staged-файлам автоматически.
- **Контракт первичен**: новое поле, статус или операция сначала появляются в
  `main.tsp`, потом `make generate-types`, потом код. Обратный порядок ловится
  в CI.

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

- **Секреты**: конфиг проверяется схемой в `plugins/env.ts`. Без `JWT_SECRET`
  от 32 символов приложение не поднимается. `.env` не коммитится.
- **База**: in-memory SQLite (`plugins/drizzle.ts`), пересоздаётся при каждом
  запуске. Для постоянного хранения нужен файл или настоящая СУБД.
