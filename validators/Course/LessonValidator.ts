import { zCourseLessonCreateDto } from "../../types/handlers/zod.gen.ts";
import type { DrizzleDB } from "../../types/index.ts";

class LessonValidator {
  static validateCreate(_db: DrizzleDB, data: unknown) {
    return zCourseLessonCreateDto.parseAsync(data);
  }
}

export default LessonValidator;
