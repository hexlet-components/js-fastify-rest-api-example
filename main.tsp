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
model BadRequestError {
  @statusCode _: 400;
  ...ProblemDetails;
}

@error
model TooManyRequestsError {
  @statusCode _: 429;
  ...ProblemDetails;
}

// Эти два исхода возможны почти везде: 400 отдаёт валидация запроса по этой же
// спеке, 429 — ограничитель частоты. Раньше их не было в контракте вовсе, и
// клиент по спеке не мог их предусмотреть.
alias CommonErrors = BadRequestError | TooManyRequestsError;

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
  // Границы те же, что у User: иначе запрос принимает имя, которое валидатор
  // ответа потом забракует, и создание падает в 500.
  @minLength(2)
  @maxLength(100)
  fullName?: string;

  email: string;

  @minLength(8)
  @secret
  password: string;
}

model UserEditDTO {
  @minLength(2)
  @maxLength(100)
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
  op index(@query @minValue(1) page?: int32 = 1): {
    @body users: {
      data: User[];
    };
  } | UnauthorizedError | CommonErrors;

  @summary("Пользователь по идентификатору")
  @get
  @useAuth(BearerAuth)
  @operationId("usersShow")
  op show(@path @minValue(1) id: int32): {
    @body _: User;
  } | NotFoundError | UnauthorizedError | CommonErrors;

  @summary("Регистрация пользователя")
  @post
  @operationId("usersCreate")
  op create(@body _: UserCreateDTO): {
    @body _: User;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | CommonErrors;

  @summary("Изменение пользователя")
  @put
  @useAuth(BearerAuth)
  @operationId("usersUpdate")
  op update(@path @minValue(1) id: int32, @body user: UserEditDTO): {
    @body user: User;
  } | NotFoundError | UnprocessableEntityError | UnauthorizedError | CommonErrors;

  @summary("Удаление пользователя")
  @delete
  @useAuth(BearerAuth)
  @operationId("usersDestroy")
  op destroy(@path @minValue(1) id: int32): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError | CommonErrors;
}

@route("/tokens")
namespace tokens {
  @summary("Выдача токена по email и паролю")
  @post
  @operationId("tokensCreate")
  op create(@body auth_info: AuthInfo): {
    @body token: TokenInfo;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError | CommonErrors;
}

@route("/courses")
namespace courses {
  @summary("Список курсов")
  @get
  @operationId("coursesIndex")
  op index(@query @minValue(1) page?: int32 = 1): {
    @body courses: {
      data: Course[];
    };
  } | CommonErrors;

  @summary("Курс по идентификатору")
  @get
  @operationId("coursesShow")
  op show(@path @minValue(1) id: int32): {
    @body course: Course;
  } | NotFoundError | CommonErrors;

  @summary("Создание курса")
  @post
  @useAuth(BearerAuth)
  @operationId("coursesCreate")
  op create(@body course: CourseCreateDTO): {
    @body course: Course;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError | CommonErrors;

  @summary("Изменение курса")
  @put
  @useAuth(BearerAuth)
  @operationId("coursesUpdate")
  op update(@path @minValue(1) id: int32, @body course: CourseEditDTO):
    | {
        @body course: Course;
      }
    | NotFoundError
    | UnprocessableEntityError
    | UnauthorizedError
    | ForbiddenError
    | CommonErrors;

  @summary("Удаление курса")
  @delete
  @useAuth(BearerAuth)
  @operationId("coursesDestroy")
  op destroy(@path @minValue(1) id: int32): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError | ForbiddenError | CommonErrors;
}

@route("/courses/{courseId}/lessons")
namespace courses_lessons {
  @summary("Список уроков курса")
  @get
  @operationId("coursesLessonsIndex")
  op index(@path @minValue(1) courseId: int32, @query @minValue(1) page?: int32 = 1): {
    @body lessons: {
      data: CourseLesson[];
    };
  } | CommonErrors;

  @summary("Урок курса")
  @get
  @operationId("coursesLessonsShow")
  op show(@path @minValue(1) courseId: int32, @path @minValue(1) id: int32): {
    @body lessons: CourseLesson;
  } | NotFoundError | CommonErrors;

  @summary("Добавление урока в курс")
  @post
  @useAuth(BearerAuth)
  @operationId("coursesLessonsCreate")
  op create(@path @minValue(1) courseId: int32, @body course: CourseLessonCreateDTO): {
    @body lesson: CourseLesson;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError | ForbiddenError | NotFoundError | CommonErrors;
}

