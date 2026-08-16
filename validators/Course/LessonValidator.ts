import { object, parseAsync, string } from "valibot";
import type { DrizzleDB } from "../../types/index.ts";

const schema = object({
  name: string(),
  body: string(),
});

class LessonValidator {
  static validate<T>(_db: DrizzleDB, data: T) {
    return parseAsync(schema, data);
  }
}

export default LessonValidator;
