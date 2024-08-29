import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schemas from '../db/schema.js'

import { Type } from '@sinclair/typebox'
import {
  FastifyInstance,
  FastifyBaseLogger,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault
} from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

declare module 'fastify' {
  interface FastifyInstance extends FastifyJwtNamespace<{ namespace: 'security' }> {
    db: ReturnType<typeof drizzle<typeof schemas>>;
    authenticate: () => Promise<void>;
  }
  type FastifyTypebox = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    TypeBoxTypeProvider
  >;
};
