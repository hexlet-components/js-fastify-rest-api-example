import "@typespec/http";
import "@typespec/openapi";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.OpenAPI;
@service(#{title:"Course publication webhook"})
namespace WebhookReceiver;
model WebhookEvent { id: string; type: "course.published"; courseId: int32; }
@route("/events") @post @operationId("receiveEvent")
op receiveEvent(@header("X-Signature") signature: string, @header("X-Event-Id") eventId: string, @body event: WebhookEvent): { @statusCode statusCode: 204; } | { @statusCode statusCode: 401 | 503; };
