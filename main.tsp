import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
import "@typespec/json-schema";

using TypeSpec.Http;
using TypeSpec.JsonSchema;

@service({
  title: "Fastify Rest Api Example",
})
@server("https://code-basics.com", "Single server endpoint")
@jsonSchema
namespace FastifyRestApiExample;

@error
model NotFoundError {
  @statusCode _: 404;
  code: "NOT_FOUND";
  message: string;
}

@error
model UnprocessableEntityError {
  @statusCode _: 422;
  code: "UNPROCESSABLE_ENTITY";
  message: string;
}

model User {
  id: numeric;
  fullName: string | null;
  email: string;
}

model UserCreateDTO {
  fullName?: string;
  email: string;
}

model UserEditDTO {
  fullName?: string;
}

@route("/users")
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
  } | NotFoundError | UnprocessableEntityError;

  @delete
  op destroy(@path id: numeric): {
    @statusCode statusCode: 204;
  } | NotFoundError;
}
