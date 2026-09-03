# Changelog

## 1.0.0 (2026-09-03)


### ⚠ BREAKING CHANGES

* применять авторизацию и права по спеке, закрыть 5xx и дыры доступа ([#18](https://github.com/hexlet-components/js-fastify-rest-api-example/issues/18))

### Features

* **api:** CONTENT-312 отдавать первую версию под префиксом /v1 ([b40108e](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/b40108e5cff3f553b8bb67222854d768b633771b))
* **api:** отдавать две версии контракта — v1 и v2 ([fe09563](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/fe0956378751704b854814b90e1b6caf68a0a6dc))
* **api:** отдавать метаданные страницы и принимать perPage ([cb3635a](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/cb3635a66ddd029d4fc65166d43474226fb8510b))
* **api:** условные запросы — ETag, If-None-Match и If-Match ([208f6a7](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/208f6a728da67d9625a554461f00108012434428))
* **codegen:** проверять полноту обработчиков статически, а генерацию — в CI ([c4f0276](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/c4f02761dd34fc6abaef7c0720189c8bb7622eea))
* **db:** перевести хранилище на PGlite ради нативных таймстемпов ([#21](https://github.com/hexlet-components/js-fastify-rest-api-example/issues/21)) ([71abac2](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/71abac26391ea6035a8c3a159439ee5a281fcdff))
* **deploy:** образ, compose и smoke-тест собранного артефакта ([97979ea](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/97979eadee182ea7eb8869e96fbc9b50108ad688))
* **lessons:** достроить CRUD уроков и убрать мёртвый слой ([a52caee](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/a52caee67308f4b09182feb75441494fb5d73b87))
* **ops:** добавить /health и /metrics ([7ae8dc7](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/7ae8dc77dd11f7413761fd91361f39c63f8ab7a8))
* **ops:** добавить трассировку OpenTelemetry ([b66cf1b](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/b66cf1b130bbb791225cd5eba9ae81935d95c258))
* применять авторизацию и права по спеке, закрыть 5xx и дыры доступа ([#18](https://github.com/hexlet-components/js-fastify-rest-api-example/issues/18)) ([12322a4](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/12322a408b8333cd6f32d6c98c4b3e9c11dbdf53))


### Bug Fixes

* **auth:** выдавать токены со сроком жизни ([0e50d6a](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/0e50d6ad8ed6035bc6158030ef13b7cb8e449863))
* **ci:** вернуть проверку формата, подняв линт выше generate-check ([df65ebe](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/df65ebe6ea7a606994df525a450f777d834a740d))
* **ci:** не давать contract-test уходить в чужой процесс ([f49374f](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/f49374fa8593c4607945d1c2add9054e184ae435))
* **codegen:** генерировать на typescript 7, обновив openapi-ts до next ([5d6897e](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/5d6897ea65727ac39775b9c654c4f6c2cdf4c70e))
* **db:** назвать колонку course_id в snake_case, как соседние ([eceb03d](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/eceb03d5618d581a67d6686865563d691b681630))
* **db:** проставлять таймстемпы дефолтом базы, а не только кодом drizzle ([87f7c6d](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/87f7c6d805101593c46d82e09f0f9ca30534ff7e))
* **db:** убрать ON DELETE CASCADE, решать удаление в приложении ([c578b3a](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/c578b3a3360b5b9273558d6a176c855240ffad28))
* **deps:** починить генерацию openapi-ts, вернув typescript 6.x ([b68ea49](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/b68ea49e44714d5b51d0c551113a739e74950987))
* **lint:** убрать мёртвые директивы biome-ignore ([#15](https://github.com/hexlet-components/js-fastify-rest-api-example/issues/15)) ([e7f30f9](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/e7f30f9a9b85ecec071e7045cc43baebdbc880fb))
* **scripts:** убрать из прогонов адрес внешней базы ([eef84b7](https://github.com/hexlet-components/js-fastify-rest-api-example/commit/eef84b7cccbd96a845da14044ac56ed6ef441ba7))
