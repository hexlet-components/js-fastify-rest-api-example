import { httpErrors } from "@fastify/sensible";
import { eq } from "drizzle-orm";

import * as schemas from "../../db/schema.ts";
import { verifyPassword } from "../../lib/password.ts";
import { defineHandlers } from "../../lib/utils.ts";

const handlers = defineHandlers({
  async tokensCreate(request, reply) {
    const client = await request.db.query.users.findFirst({
      where: eq(schemas.users.email, request.body.email.toLowerCase()),
    });

    // Один и тот же ответ на «нет такого email» и «неверный пароль»: иначе
    // эндпоинт превращается в проверку того, зарегистрирован ли адрес.
    const valid = client
      ? await verifyPassword(request.body.password, client.passwordDigest)
      : false;
    if (!client || !valid) {
      throw httpErrors.unauthorized("Invalid email or password");
    }

    const token = request.server.jwt.sign({ id: client.id });
    return reply.code(201).send({ token });
  },
});

export default handlers;
