import { asc, eq } from "drizzle-orm";
import { publicUserColumns, publicUserFields } from "../../db/projections.ts";
import * as schemas from "../../db/schema.ts";
import { hashPassword } from "../../lib/password.ts";
import { defineHandlers, ensure, getPagingOptions } from "../../lib/utils.ts";
import UserValidator from "../../validators/UserValidator.ts";

// Каждый запрос ограничен публичной проекцией из db/projections.ts: в строке
// users лежит passwordDigest, и без явного перечисления полей он уедет в ответ.
const handlers = defineHandlers({
  async usersIndex(request, reply) {
    const page = request.query?.page ?? 1;
    const users = await request.db.query.users.findMany({
      columns: publicUserColumns,
      orderBy: asc(schemas.users.id),
      ...getPagingOptions(page, 1),
    });

    return reply.code(200).send({ data: users });
  },

  async usersShow(request, reply) {
    const user = await request.db.query.users.findFirst({
      columns: publicUserColumns,
      where: eq(schemas.users.id, request.params.id),
    });
    ensure(user, 404);
    return reply.code(200).send(user);
  },

  async usersCreate(request, reply) {
    const { password, ...validated } = await UserValidator.validateCreate(request.db, request.body);
    const [user] = await request.db
      .insert(schemas.users)
      .values({ ...validated, passwordDigest: await hashPassword(password) })
      .returning(publicUserFields);

    return reply.code(201).send(user);
  },

  async usersUpdate(request, reply) {
    // Запись читается до правки: так 404 наступает раньше любой работы, и есть
    // что вернуть, если менять нечего.
    const existing = await request.db.query.users.findFirst({
      columns: publicUserColumns,
      where: eq(schemas.users.id, request.params.id),
    });
    ensure(existing, 404);

    const { password, ...validated } = await UserValidator.validateEdit(request.db, request.body);
    const values = password
      ? { ...validated, passwordDigest: await hashPassword(password) }
      : validated;

    // Все поля UserEditDTO необязательные, поэтому тело может оказаться
    // пустым. drizzle на пустом set бросает «No values to set» — это был 500.
    if (Object.keys(values).length === 0) {
      return reply.code(200).send(existing);
    }

    const [user] = await request.db
      .update(schemas.users)
      .set(values)
      .where(eq(schemas.users.id, request.params.id))
      .returning(publicUserFields);
    return reply.code(200).send(user);
  },

  async usersDestroy(request, reply) {
    const [user] = await request.db
      .delete(schemas.users)
      .where(eq(schemas.users.id, request.params.id))
      .returning(publicUserFields);
    ensure(user, 404);
    return reply.code(204).send();
  },
});

export default handlers;
