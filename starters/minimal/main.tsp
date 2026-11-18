import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.OpenAPI;
@service(#{title:"Minimal catalog"})
namespace Minimal;
model Course { @minValue(1) id: int32; @minLength(1) title: string; description: string | null; }
model Problem { type: url; title: string; status: int32; detail: string; }
@error model Failure { @statusCode statusCode: 400 | 404 | 500; @header contentType: "application/problem+json"; @body body: Problem; }
@route("/courses/{courseId}") @get @operationId("getCourse")
op getCourse(@path @minValue(1) courseId: int32): Course | Failure;
