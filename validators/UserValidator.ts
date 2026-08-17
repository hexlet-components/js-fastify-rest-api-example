import * as z from "zod";
import { users } from "../db/schema.ts";
import unique from "../rules/unique.ts";
import { zUserCreateDto, zUserEditDto } from "../types/handlers/zod.gen.ts";
import type { DrizzleDB } from "../types/index.ts";

// Структуру запроса уже проверил fastify по спецификации, поэтому здесь
// остаются только бизнес-правила. Схема при этом не переписывается руками, а
// расширяет сгенерированную: иначе поля, не перечисленные в валидаторе, zod
// молча выбросит, и до базы они не доедут.
class UserValidator {
  static validateCreate(db: DrizzleDB, data: unknown) {
    const schema = zUserCreateDto.extend({
      email: z
        .string()
        .toLowerCase()
        .refine(unique(db, { schema: users, field: "email" }), {
          message: "email is already taken",
        }),
    });

    return schema.parseAsync(data);
  }

  static validateEdit(_db: DrizzleDB, data: unknown) {
    return zUserEditDto.parseAsync(data);
  }
}

export default UserValidator;
