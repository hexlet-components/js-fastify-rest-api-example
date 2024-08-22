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
  code: "NOT_FOUND";
  message: string;
}

model User {
  id: numeric;
  fullName: string;
  phone: string;
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
  } | {
    @body error: NotFoundError;
  };
}
