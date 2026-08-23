import { httpErrors } from "@fastify/sensible";
import type { RouteHandlers } from "../types/handlers/fastify.gen.ts";

export function getPagingOptions(page: number, perPage = 10) {
  return {
    limit: perPage,
    offset: (page - 1) * perPage,
  };
}

// Раньше здесь вызывался createError, который ошибку только создаёт. Из-за
// этого 404 не наступал никогда: отсутствующая запись давала 200 с пустым
// телом, а /tokens с неизвестным email — 500 при обращении к полю у undefined.
// Хуже того, сигнатура asserts заставляла tsc ручаться за проверку, которой не
// происходило.
export function ensure<T>(
  value: T | null | undefined,
  status: number = 404,
  msg = "Not Found",
): asserts value is NonNullable<T> {
  if (value == null) throw httpErrors.createError(status, msg);
}

export function defineHandlers<T extends Partial<RouteHandlers>>(t: T) {
  return t;
}
