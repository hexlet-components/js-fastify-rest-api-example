import { eq } from "drizzle-orm";

import * as schemas from "../../db/schema.ts";
import { defineHandlers, ensure } from "../../lib/utils.ts";

const handlers = defineHandlers({
  async tokensCreate(request, reply) {
    const client = await request.db.query.users.findFirst({
      where: eq(schemas.users.email, request.body.email),
    });
    ensure(reply, client, 404);
    const token = request.server.jwt.sign({ id: client.id });
    return reply.code(201).send({ token });
  },
});

export default handlers;
