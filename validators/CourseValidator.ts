import { zCourseCreateDto, zCourseEditDto } from "../types/handlers/zod.gen.ts";
import type { DrizzleDB } from "../types/index.ts";

// Схемы берутся сгенерированными: creatorId обработчик добавляет сам, а
// перечислять поля руками нельзя, иначе не перечисленные zod выбросит.
class CourseValidator {
  static validateCreate(_db: DrizzleDB, data: unknown) {
    return zCourseCreateDto.parseAsync(data);
  }

  static validateEdit(_db: DrizzleDB, data: unknown) {
    return zCourseEditDto.parseAsync(data);
  }
}

export default CourseValidator;
