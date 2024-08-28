import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";
import "@typespec/openapi3";
import "@typespec/json-schema";

using TypeSpec.Versioning;
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.JsonSchema;

@service({
  title: "Fastify Rest Api Example",
})
@server("https://code-basics.com", "Single server endpoint")
@jsonSchema
@versioned(Versions)
namespace FastifyRestApiExample;

enum Versions {
  v1,
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
  createdAt: utcDateTime;
}

model User {
  id: numeric;
  fullName: string | null;
  email: string;
  ...Timestamps;
}

model UserCreateDTO {
  fullName?: string;
  email: string;
}

model UserEditDTO {
  fullName?: string;
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

model CourseLessonCreateDTO {
  name: string;
  body: string;
}

@route("/users")
@useAuth(BearerAuth)
namespace users {
  @get
  op index(@query page?: numeric = 1): {
    @body users: {
      data: User[];
    };
  };

  @get
  op show(@path id: numeric): {
    @body user: User;
  } | NotFoundError;

  @post
  op create(@body user: UserCreateDTO): {
    @body user: User;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError;

  @patch
  op update(@path id: numeric, @body user: UserEditDTO): {
    @body user: User;
  } | NotFoundError | UnprocessableEntityError;

  @delete
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError;
}

@route("/courses")
namespace courses {
  @get
  op index(@query page?: numeric = 1): {
    @body courses: {
      data: Course[];
    };
  };

  @get
  op show(@path id: numeric): {
    @body course: Course;
  } | NotFoundError;

  @post
  @useAuth(BearerAuth)
  op create(@body course: CourseCreateDTO): {
    @body course: Course;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError;

  @patch
  @useAuth(BearerAuth)
  op update(@path id: numeric, @body course: CourseEditDTO): {
    @body course: Course;
  } | NotFoundError | UnprocessableEntityError | UnauthorizedError;

  @delete
  @useAuth(BearerAuth)
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError | UnauthorizedError;
}

@route("/courses/{courseId}/lessons")
namespace courses_lessons {
  @get
  op index(@path courseId: numeric, @query page?: numeric = 1): {
    @body lessons: {
      data: CourseLesson[];
    };
  };

  @get
  op show(@path courseId: numeric, @path id: numeric): {
    @body lessons: CourseLesson;
  } | NotFoundError;

  @post
  @useAuth(BearerAuth)
  op create(@path courseId: numeric, @body course: CourseLessonCreateDTO): {
    @body lesson: CourseLesson;
    @statusCode statusCode: 201;
  } | UnprocessableEntityError | UnauthorizedError;
}
