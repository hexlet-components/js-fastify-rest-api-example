import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@typespec/openapi3";
import "@typespec/openapi";

using TypeSpec.Versioning;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Rest API Example" })
@info(#{
  license: #{
    name: "ISC",
    url: "https://opensource.org/license/isc-license-txt",
  },
})
@server("http://localhost:3000", "Локальная разработка")
@versioned(Versions)
namespace FastifyRestApiExample;

enum Versions {
  v1,
  v2,
}

/**
 * https://www.rfc-editor.org/rfc/rfc9457.html
 */
@error
model ProblemDetails {
  @header("content-type") contentType: "application/problem+json";
  type?: string;
  title?: string;
  status?: integer;
  detail?: string;
  instance?: string;
}

@error
model NotFoundError {
  @statusCode _: 404;
  ...ProblemDetails;
}

@error
model UnauthorizedError {
  @statusCode _: 401;
  ...ProblemDetails;
}

@error
model ForbiddenError {
  @statusCode _: 403;
  ...ProblemDetails;
}

@error
model UnprocessableEntityError {
  @statusCode _: 422;
  ...ProblemDetails;
  errors: Array<{
    message: string;
    rule: string;
    field: string;
  }>;
}

model Timestamps {
  // createdAt: utcDateTime;
}

model User {
  id: numeric;

  @minLength(2)
  @maxLength(100)
  fullName: string | null;

  @added(Versions.v2) phone: string;

  // @format("email")
  email: string;

  ...Timestamps;
}

model UserCreateDTO {
  fullName?: string;
  email: string;

  @minLength(8)
  @secret
  password: string;
}

model UserEditDTO {
  fullName?: string;

  @minLength(8)
  @secret
  password?: string;
}

model Course {
  id: numeric;
  name: string;
  description: string;
  ...Timestamps;
}

model CourseCreateDTO {
  name: string;
  description: string;
}

model CourseEditDTO {
  name?: string;
  description?: string;
}

model CourseLesson {
  id: numeric;
  courseId: numeric;
  name: string;
  body: string;
  ...Timestamps;
}

model AuthInfo {
  email: string;

  @secret
  password: string;
}

model TokenInfo {
  token: string;
}

model CourseLessonCreateDTO {
  name: string;
  body: string;
}

@route("/users")
namespace users {
  @summary("Список пользователей")
  @operationId("usersIndex")
  @get
  @useAuth(BearerAuth)
  op index(@query page?: numeric = 1): {
    @body users: {
      data: User[];
    };
  } | UnauthorizedError;

  @summary("Пользователь по идентификатору")
  @get
  @useAuth(BearerAuth)
  @operationId("usersShow")
  op show(@path id: numeric): {
    @body _: User;
  } | NotFoundError | UnauthorizedError;

  @summary("Регистрация пользователя")
  @post
  @operationId("usersCreate")
  op create(@body _: UserCreateDTO): {
    @body _: User;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError;

  @summary("Изменение пользователя")
  @put
  @useAuth(BearerAuth)
  @operationId("usersUpdate")
  op update(@path id: numeric, @body user: UserEditDTO): {
    @body user: User;
  } | NotFoundError | UnprocessableEntityError | UnauthorizedError;

  @summary("Удаление пользователя")
  @delete
  @useAuth(BearerAuth)
  @operationId("usersDestroy")
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError;
}

@route("/tokens")
namespace tokens {
  @summary("Выдача токена по email и паролю")
  @post
  @operationId("tokensCreate")
  op create(@body auth_info: AuthInfo): {
    @body token: TokenInfo;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError;
}

@route("/courses")
namespace courses {
  @summary("Список курсов")
  @get
  @operationId("coursesIndex")
  op index(@query page?: numeric = 1): {
    @body courses: {
      data: Course[];
    };
  };

  @summary("Курс по идентификатору")
  @get
  @operationId("coursesShow")
  op show(@path id: numeric): {
    @body course: Course;
  } | NotFoundError;

  @summary("Создание курса")
  @post
  @useAuth(BearerAuth)
  @operationId("coursesCreate")
  op create(@body course: CourseCreateDTO): {
    @body course: Course;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError;

  @summary("Изменение курса")
  @put
  @useAuth(BearerAuth)
  @operationId("coursesUpdate")
  op update(@path id: numeric, @body course: CourseEditDTO):
    | {
        @body course: Course;
      }
    | NotFoundError
    | UnprocessableEntityError
    | UnauthorizedError
    | ForbiddenError;

  @summary("Удаление курса")
  @delete
  @useAuth(BearerAuth)
  @operationId("coursesDestroy")
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError | ForbiddenError;
}

@route("/courses/{courseId}/lessons")
namespace courses_lessons {
  @summary("Список уроков курса")
  @get
  @operationId("coursesLessonsIndex")
  op index(@path courseId: numeric, @query page?: numeric = 1): {
    @body lessons: {
      data: CourseLesson[];
    };
  };

  @summary("Урок курса")
  @get
  @operationId("coursesLessonsShow")
  op show(@path courseId: numeric, @path id: numeric): {
    @body lessons: CourseLesson;
  } | NotFoundError;

  @summary("Добавление урока в курс")
  @post
  @useAuth(BearerAuth)
  @operationId("coursesLessonsCreate")
  op create(@path courseId: numeric, @body course: CourseLessonCreateDTO): {
    @body lesson: CourseLesson;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError | ForbiddenError | NotFoundError;
}

