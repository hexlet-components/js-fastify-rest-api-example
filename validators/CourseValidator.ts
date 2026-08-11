/** biome-ignore-all lint/complexity/noStaticOnlyClass: - */

import { object, parseAsync, string } from "valibot";
import type { DrizzleDB } from "../types/index.ts";

// Keep validation permissive: accept fields used by routes
// and let handlers add/override creatorId.
const schema = object({
  name: string(),
  description: string(),
});

class CourseValidator {
  static validate<T>(_db: DrizzleDB, data: T) {
    return parseAsync(schema, data);
  }
}

export default CourseValidator;
