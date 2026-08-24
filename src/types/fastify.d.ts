import type { drizzle } from "drizzle-orm/pglite";
import "@fastify/jwt";
// import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
// import { Type } from '@sinclair/typebox'
import type {
  FastifyBaseLogger,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
} from "fastify";
import type * as schemas from "../db/schema.ts";

declare module "fastify" {
  interface FastifyRequest {
    db: ReturnType<typeof drizzle<typeof schemas>>;
  }
  interface FastifyInstance extends FastifyJwtNamespace<{ namespace: "security" }> {
    db: ReturnType<typeof drizzle<typeof schemas>>;
    config: {
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      NODE_ENV: string;
      CORS_ORIGIN: string;
      RATE_LIMIT_MAX: number;
      MAX_EVENT_LOOP_DELAY: number;
      MAX_EVENT_LOOP_UTILIZATION: number;
    };
  }
  // type FastifyTypebox = FastifyInstance<
  //   RawServerDefault,
  //   RawRequestDefaultExpression<RawServerDefault>,
  //   RawReplyDefaultExpression<RawServerDefault>,
  //   FastifyBaseLogger,
  //   TypeBoxTypeProvider
  // >;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number }; // payload type is used for signing and verifying
    user: {
      id: number;
    }; // user type is return type of `request.user` object
  }
}
