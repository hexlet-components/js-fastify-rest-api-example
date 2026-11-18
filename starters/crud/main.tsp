import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.OpenAPI;
@service(#{ title: "Course catalog CRUD starter" })
namespace CatalogCrud;
model CourseInput {
  @minLength(1) title: string;
  description?: string | null;
}
model CoursePatch {
  @minLength(1) title?: string;
  description?: string | null;
}
model Course {
  @minValue(1) id: int32;
  @minLength(1) title: string;
  description: string | null;
}
model Problem { title: string; status: int32; detail?: string; }
@error model Failure {
  @statusCode statusCode: 400 | 404 | 415 | 500;
  @header contentType: "application/problem+json";
  @body body: Problem;
}
@route("/courses") @get @operationId("listCourses")
op listCourses(): Course[] | Failure;
@route("/courses/{courseId}") @get @operationId("getCourse")
op getCourse(@path @minValue(1) courseId: int32): Course | Failure;
@route("/courses") @post @operationId("createCourse")
op createCourse(@body body: CourseInput): {
  @statusCode statusCode: 201;
  @header location: string;
  @body body: Course;
} | Failure;
@route("/courses/{courseId}") @patch @operationId("updateCourse")
op updateCourse(@path @minValue(1) courseId: int32, @body body: CoursePatch): Course | Failure;
@route("/courses/{courseId}") @delete @operationId("deleteCourse")
op deleteCourse(@path @minValue(1) courseId: int32): { @statusCode statusCode: 204; } | Failure;
