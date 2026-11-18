import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.OpenAPI;
@service(#{title: "Course catalog"})
namespace Catalog;
model Problem { type: url; title: string; status: int32; detail: string; }
@error model Failure {
  @statusCode statusCode: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 429 | 500;
  @header contentType: "application/problem+json";
  @header retryAfter?: string;
  @body body: Problem;
}
model CourseInput { @minLength(1) title: string; description?: string | null; }
model CoursePatch { @minLength(1) title?: string; description?: string | null; }
model Course { @minLength(1) title: string; description: string | null; @minValue(1) id: int32; ownerId: int32; version: int32; published: boolean; createdAt: utcDateTime; }
model Collection { data: Course[]; meta: {count: int32}; links: {self: string; next: string | null}; }
model FileInfo { id: int32; contentType: string; size: int32; downloadUrl: string; }
model Lesson { id: int32; courseId: int32; title: string; }
model Principal { id: int32; scopes: string[]; }
model Operation { id: string; status: "pending" | "running" | "succeeded" | "failed"; resultUrl: string | null; error: Problem | null; }
@route("/courses") @get @operationId("listCourses")
op listCourses(@query @minValue(1) @maxValue(100) limit?: int32, @query cursor?: string, @query sort?: "id" | "-id", @query title?: string): { @header link?: string; @body body: Collection } | Failure;
@route("/courses/{courseId}") @get @operationId("getCourse")
op getCourse(@path @minValue(1) courseId: int32): Course | Failure;
@useAuth(BearerAuth) @route("/courses") @post @operationId("createCourse")
op createCourse(@header("Idempotency-Key") idempotencyKey: string, @body body: CourseInput): { @statusCode statusCode: 201; @header location: string; @body body: Course } | Failure;
@useAuth(BearerAuth) @route("/courses/{courseId}") @patch @operationId("updateCourse")
op updateCourse(@path courseId: int32, @body body: CoursePatch): Course | Failure;
@useAuth(BearerAuth) @route("/courses/{courseId}") @delete @operationId("deleteCourse")
op deleteCourse(@path courseId: int32): { @statusCode statusCode: 204 } | Failure;
@route("/courses/{courseId}/lessons/{lessonId}") @get @operationId("getLesson")
op getLesson(@path courseId: int32, @path lessonId: int32): Lesson | Failure;
@useAuth(BearerAuth) @route("/users/{userId}/courses") @get @operationId("getUserCourses")
op getUserCourses(@path userId: int32): Collection | Failure;
@useAuth(BearerAuth) @route("/users/{userId}/courses") @put @operationId("replaceUserCourses")
op replaceUserCourses(@path userId: int32, @body body: {courseIds: int32[]}): { @statusCode statusCode: 204 } | Failure;
@useAuth(BearerAuth) @route("/users/{userId}/courses/{courseId}") @put @operationId("addUserCourse")
op addUserCourse(@path userId: int32, @path courseId: int32): { @statusCode statusCode: 204 } | Failure;
@useAuth(BearerAuth) @route("/users/{userId}/courses/{courseId}") @delete @operationId("removeUserCourse")
op removeUserCourse(@path userId: int32, @path courseId: int32): { @statusCode statusCode: 204 } | Failure;
@useAuth(BearerAuth) @route("/courses/{courseId}/cover") @put @operationId("uploadCover")
op uploadCover(@path courseId: int32, @header contentType: "image/png", @body body: bytes): { @statusCode statusCode: 201; @body body: FileInfo } | Failure;
@route("/courses/{courseId}/cover") @get @operationId("getCover")
op getCover(@path courseId: int32): FileInfo | Failure;
@route("/files/{fileId}/content") @get @operationId("getFileContent")
op getFileContent(@path fileId: int32): { @header contentType: "image/png"; @body body: bytes } | Failure;
@route("/files/{fileId}/download") @get @operationId("downloadFile")
op downloadFile(@path fileId: int32): { @statusCode statusCode: 303; @header location: string; @body body: string } | Failure;
@useAuth(BearerAuth) @route("/me") @get @operationId("getMe")
op getMe(): Principal | Failure;
@useAuth(BearerAuth) @route("/exports") @post @operationId("createExport")
op createExport(@header("Idempotency-Key") idempotencyKey: string, @body body: {format: "json" | "csv"}): { @statusCode statusCode: 202; @header location: string; @body body: Operation } | Failure;
@useAuth(BearerAuth) @route("/operations/{operationId}") @get @operationId("getOperation")
op getOperation(@path operationId: string): Operation | Failure;
@useAuth(BearerAuth) @route("/operations/{operationId}/result") @get @operationId("getExportResult")
op getExportResult(@path operationId: string): { @header contentType: "application/json"; @body body: Course[] } | { @header contentType: "text/csv"; @body body: string } | Failure;
@useAuth(BearerAuth) @route("/courses/{courseId}/publication") @post @operationId("publishCourse")
op publishCourse(@path courseId: int32, @body body: {expectedVersion: int32}): Course | Failure;
