import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@typespec/openapi3";
import "@typespec/openapi";

using TypeSpec.Versioning;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

@service(#{ title: "Rest API Example" })
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
  @operationId("usersIndex")
  @get
  @useAuth(BearerAuth)
  op index(@query page?: numeric = 1): {
    @body users: {
      data: User[];
    };
  };

  @get
  @useAuth(BearerAuth)
  @operationId("usersShow")
  op show(@path id: numeric): {
    @body _: User;
  } | NotFoundError;

  @post
  @operationId("usersCreate")
  op create(@body _: UserCreateDTO): {
    @body _: User;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError;

  @put
  @useAuth(BearerAuth)
  @operationId("usersUpdate")
  op update(@path id: numeric, @body user: UserEditDTO): {
    @body user: User;
  } | NotFoundError | UnprocessableEntityError;

  @delete
  @useAuth(BearerAuth)
  @operationId("usersDestroy")
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError;
}

@route("/tokens")
namespace tokens {
  @post
  @operationId("tokensCreate")
  op create(@body auth_info: AuthInfo): {
    @body token: TokenInfo;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError;
}

@route("/courses")
namespace courses {
  @get
  @operationId("coursesIndex")
  op index(@query page?: numeric = 1): {
    @body courses: {
      data: Course[];
    };
  };

  @get
  @operationId("coursesShow")
  op show(@path id: numeric): {
    @body course: Course;
  } | NotFoundError;

  @post
  @useAuth(BearerAuth)
  @operationId("coursesCreate")
  op create(@body course: CourseCreateDTO): {
    @body course: Course;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError;

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

  @delete
  @useAuth(BearerAuth)
  @operationId("coursesDestroy")
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError | ForbiddenError;
}

@route("/courses/{courseId}/lessons")
namespace courses_lessons {
  @get
  @operationId("coursesLessonsIndex")
  op index(@path courseId: numeric, @query page?: numeric = 1): {
    @body lessons: {
      data: CourseLesson[];
    };
  };

  @get
  @operationId("coursesLessonsShow")
  op show(@path courseId: numeric, @path id: numeric): {
    @body lessons: CourseLesson;
  } | NotFoundError;

  @post
  @useAuth(BearerAuth)
  @operationId("coursesLessonsCreate")
  op create(@path courseId: numeric, @body course: CourseLessonCreateDTO): {
    @body lesson: CourseLesson;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError | ForbiddenError | NotFoundError;
}

