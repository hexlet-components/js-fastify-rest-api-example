import type { Course } from "../types/index.ts";

// Права на курс отдельно от обработчиков: правило одно и то же для правки,
// удаления и добавления уроков, а список операций будет расти.
export default class CoursePolicy {
  static canUpdate(course: Course, userId: number) {
    return course.creatorId === userId;
  }

  static canDestroy(course: Course, userId: number) {
    return course.creatorId === userId;
  }

  // Урок меняет чужой курс, поэтому право то же, что на правку самого курса.
  static canAddLesson(course: Course, userId: number) {
    return course.creatorId === userId;
  }
}
