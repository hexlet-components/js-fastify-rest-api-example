import type { FastifyReply } from "fastify";
import type { RouteHandlers } from "../types/handlers/fastify.gen.ts";

export function getPagingOptions(page: number, perPage = 10) {
  return {
    limit: perPage,
    offset: (page - 1) * perPage,
  };
}

export function ensure<T>(
  reply: FastifyReply,
  value: T | null | undefined,
  status: number = 404,
  msg?: string,
): asserts value is NonNullable<T> {
  const m = msg || "Not Found";
  if (value == null) reply.server.httpErrors.createError(status, m);
}

export function defineHandlers<T extends Partial<RouteHandlers>>(t: T) {
  return t;
}
