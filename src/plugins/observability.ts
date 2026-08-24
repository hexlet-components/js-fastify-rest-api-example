import underPressure from "@fastify/under-pressure";
import fastifyMetricsModule from "fastify-metrics";
import { sql } from "drizzle-orm";
import fp from "fastify-plugin";

// fastify-metrics — CJS-пакет: под NodeNext импорт по умолчанию даёт
// пространство имён, сам плагин лежит в .default (как и у ajv-formats).
const fastifyMetrics = fastifyMetricsModule.default;

export default fp(
  async (fastify) => {
    // /health для оркестратора: 503, когда приложение не в состоянии обслужить
    // запрос. Проверка базы включена в healthCheck — без неё живой процесс с
    // мёртвым соединением считался бы здоровым.
    await fastify.register(underPressure, {
      exposeStatusRoute: {
        url: "/health",
        routeOpts: { logLevel: "warn" },
      },
      healthCheck: async () => {
        await fastify.db.execute(sql`select 1`);
        return true;
      },
      healthCheckInterval: 5_000,
      // Пороги из конфига: под нагрузкой лучше отвечать медленно, чем отдавать
      // 503 на всё подряд, а в тестах шеддинг надо выключать вовсе — иначе
      // параллельный прогон на загруженной машине падает не по вине кода.
      maxEventLoopDelay: fastify.config.MAX_EVENT_LOOP_DELAY,
      maxEventLoopUtilization: fastify.config.MAX_EVENT_LOOP_UTILIZATION,
    });

    await fastify.register(fastifyMetrics, {
      endpoint: "/metrics",
      // Метрики по маршрутам из спеки, а не по конкретным URL: иначе
      // /courses/1 и /courses/2 дают отдельные серии и кардинальность растёт
      // по числу записей.
      routeMetrics: { groupStatusCodes: true },
      // Реестр prom-client глобальный на процесс, поэтому второй register
      // падает с «metric has already been registered». В бою приложение
      // поднимается один раз, а в тестах — на каждый build().
      clearRegisterOnInit: true,
    });
  },
  // Зависимости объявлены явно: плагин читает и fastify.config, и fastify.db.
  // Без этого avvio грузит его параллельно с drizzle, fastify.db в healthCheck
  // оказывается undefined, проверка падает — и under-pressure отдаёт 503 на
  // всё, пока через healthCheckInterval не пройдёт следующая. Проявлялось как
  // случайные 503 в параллельном прогоне тестов.
  { name: "observability", dependencies: ["env", "drizzle"] },
);
