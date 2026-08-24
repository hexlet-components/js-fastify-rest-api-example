# js-fastify-rest-api-example

REST API на [Fastify](https://fastify.dev/), собранный «по-взрослому»:
схема API описана отдельно от кода, база через ORM, валидация по схеме.

## Зачем это нужно

Пример того, как выглядит API-проект, когда он перерастает один файл с
маршрутами. Отличия от учебной заглушки видны сразу:

- **Контракт первичен.** API описан на [TypeSpec](https://typespec.io/)
  в `main.tsp`, из него генерируется OpenAPI, а из OpenAPI — типы для кода.
  Документация не расходится с реализацией, потому что порождена из одного
  источника.
- **Одна спека проверяет код дважды.** Из OpenAPI генерируются типы
  обработчиков и zod-схемы ([hey-api](https://heyapi.dev/)): первое проверяет
  `tsc` статически, второе — валидаторы в рантайме. Сами маршруты по этой же
  спеке регистрирует `fastify-openapi-glue`, поэтому таблица маршрутов и
  проверка запросов тоже не пишутся руками. `make generate-check` в CI не даёт
  сгенерированному разойтись со спекой.
- **База через [Drizzle](https://orm.drizzle.team/)**: схема в `src/db/schema.ts`,
  миграции генерируются по ней. Под ней [PGlite](https://pglite.dev/) — postgres
  в wasm, внутри процесса и в памяти: отдельного сервиса не нужно, а типы
  нативные, `timestamptz` в схеме это время, а не число с кодеком поверх.
- **Валидация входа** отдельным слоем в `src/validators/`, а не внутри обработчика.
- **Две версии API из одной спеки.** `@added(Versions.v2)` в TypeSpec — и v2
  получает поле, которого нет в v1; каждая версия отдаётся со своим документом
  и проверяется контрактными тестами отдельно.
- **Авторизация тоже из спеки.** `@useAuth` в контракте применяет
  `fastify-openapi-glue` через securityHandlers, а не `jwtVerify()` в каждом
  обработчике — забыть его негде.
- **Спека проверяется снаружи.** `make contract-test` натравливает
  [schemathesis](https://schemathesis.readthedocs.io/) на поднятое приложение:
  тот генерирует запросы из OpenAPI и ловит то, что не видят ни tsc, ни
  валидаторы — незадокументированные статусы, 5xx на краевых входах и
  неприменённую авторизацию.

## Запуск

```bash
make setup
make dev
make test
```

Документация — на http://localhost:3000/docs, сама спека — на `/openapi.json`.

Полезное:

```bash
make routes             # список маршрутов
make migration-generate # миграция по изменённой схеме
make migration-check    # схема не менялась без миграции
make generate-types     # OpenAPI и типы из TypeSpec
make generate-check     # проверить, что сгенерированное закоммичено
make lint-openapi       # линт контракта
make contract-test      # schemathesis по спеке (нужен uv)
make test-coverage      # тесты с порогами покрытия
make smoke-test         # собрать образ и проверить его
make mock               # поднять мок-сервер по OpenAPI
```

---

[![Hexlet Ltd. logo](https://raw.githubusercontent.com/Hexlet/assets/master/images/hexlet_logo128.png)](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=js-fastify-rest-api-example)

This repository is created and maintained by the team and the community of Hexlet, an educational project. [Read more about Hexlet](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=js-fastify-rest-api-example).

See most active contributors on [hexlet-friends](https://friends.hexlet.io/).
