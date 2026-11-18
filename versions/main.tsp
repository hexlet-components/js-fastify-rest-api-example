import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.OpenAPI;
@service(#{title:"Catalog v1"})
namespace V1 {
  model Course { id: int32; title: string; }
  @route("/courses/{courseId}") @get @operationId("getCourse")
  op getCourse(@path courseId: int32): Course;
}
@service(#{title:"Catalog v2"})
namespace V2 {
  model Course { id: int32; name: string; }
  @route("/courses/{courseId}") @get @operationId("getCourse")
  op getCourse(@path courseId: int32): Course;
}
