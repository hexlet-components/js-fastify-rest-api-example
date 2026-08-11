/** biome-ignore-all lint/complexity/noStaticOnlyClass: - */

import { email, objectAsync, parseAsync, pipeAsync, string, toLowerCase } from "valibot";
import { users } from "../db/schema.ts";
import unique from "../rules/unique.ts";
import type { DrizzleDB } from "../types/index.ts";

class UserValidator {
  static async validate<T>(db: DrizzleDB, data: T) {
    const schema = objectAsync({
      email: pipeAsync(
        string(),
        email(),
        toLowerCase(),
        unique(db, { schema: users, field: "email" }),
      ),
    });

    return parseAsync(schema, data);
  }
}

export default UserValidator;
