import { asc, eq } from "drizzle-orm";
import * as schemas from "../../db/schema.ts";
import { defineHandlers, ensure, getPagingOptions } from "../../lib/utils.ts";
import UserValidator from "../../validators/UserValidator.ts";

const handlers = defineHandlers({
  async usersIndex(request, reply) {
    const page = request.query?.page ?? 1;
    const users = await request.db.query.users.findMany({
      orderBy: asc(schemas.users.id),
      ...getPagingOptions(page, 1),
    });

    return reply.code(200).send({ data: users });
  },
  async usersShow(request, reply) {
    const user = await request.db.query.users.findFirst({
      where: eq(schemas.users.id, request.params.id),
    });
    ensure(reply, user, 404);
    return reply.code(200).send(user);
  },

  async usersCreate(request, reply) {
    const validated = await UserValidator.validateCreate(request.db, request.body);
    const [user] = await request.db.insert(schemas.users).values(validated).returning();

    return reply.code(201).send(user);
  },

  async usersUpdate(request, reply) {
    const validated = await UserValidator.validateEdit(request.db, request.body);
    const [user] = await request.db
      .update(schemas.users)
      .set(validated)
      .where(eq(schemas.users.id, request.params.id))
      .returning();
    ensure(reply, user, 404);
    return reply.code(200).send(user);
  },

  async usersDestroy(request, reply) {
    const [user] = await request.db
      .delete(schemas.users)
      .where(eq(schemas.users.id, request.params.id))
      .returning();
    ensure(reply, user, 404);
    return reply.code(204).send();
  },
});

export default handlers;
