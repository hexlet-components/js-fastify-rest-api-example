import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type { RouteHandlers } from "../generated/fastify.gen.ts";
import type { Store } from "./db.ts";
import { fail, once, randomUUID } from "./services.ts";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: number; scopes: string[] };
    user: { id: number; scopes: string[] };
  }
}
export function createHandlers(app: FastifyInstance, store: Store): RouteHandlers {
  const principal = (request: FastifyRequest) => request.user;
  const scope = (request: FastifyRequest) => {
    if (!principal(request).scopes.includes("courses:write"))
      fail(403, "Token lacks courses:write");
  };
  const own = async (request: FastifyRequest, id: number) => {
    scope(request);
    const course = await store.getCourse(id);
    if (!course || course.ownerId !== principal(request).id) fail(404, "Course not found");
    return course;
  };
  const user = (request: FastifyRequest, id: number) => {
    scope(request);
    if (principal(request).id !== id) fail(404, "User not found");
  };
  const exists = async (id: number) => {
    const course = await store.getCourse(id);
    if (!course) fail(404, "Course not found");
    return course;
  };
  const fileInfo = (row: { id: number; content: Buffer }) => ({
    id: row.id,
    contentType: "image/png",
    size: row.content.length,
    downloadUrl: `/files/${row.id}/download`,
  });
  const operation = (row: Record<string, unknown>) => ({
    id: row.id as string,
    status: row.status as "pending" | "running" | "succeeded" | "failed",
    resultUrl: row.status === "succeeded" ? `/operations/${row.id}/result` : null,
    error: (row.error ?? null) as import("../generated/types.gen.ts").Problem | null,
  });
  return {
    async listCourses(request, reply) {
      const { limit = 10, cursor, sort = "id", title } = request.query ?? {};
      let id = 0;
      if (cursor) {
        const decoded = Buffer.from(cursor, "base64url").toString();
        if (!/^\d+$/.test(decoded)) fail(400, "Invalid cursor");
        id = Number(decoded);
      }
      const direction = sort === "id" ? "ASC" : "DESC";
      const compare = sort === "id" ? ">" : "<";
      const rows = (
        await store.pool.query(
          `SELECT * FROM courses WHERE ($1::text IS NULL OR title ILIKE '%'||$1||'%') AND ($2=0 OR id ${compare} $2) ORDER BY id ${direction} LIMIT $3`,
          [title ?? null, id, limit + 1],
        )
      ).rows;
      const data = await Promise.all(rows.slice(0, limit).map((row) => store.getCourse(row.id)));
      const self = request.url;
      let next: string | null = null;
      if (rows.length > limit) {
        const query = new URLSearchParams({
          limit: String(limit),
          sort,
          cursor: Buffer.from(String(rows[limit - 1].id)).toString("base64url"),
        });
        if (title) query.set("title", title);
        next = `/courses?${query}`;
        reply.header("Link", `<${next}>; rel="next"`);
      }
      return reply.code(200).send({
        data: data.filter((row): row is NonNullable<typeof row> => Boolean(row)),
        meta: { count: data.length },
        links: { self, next },
      });
    },
    async getCourse(request, reply) {
      return reply.code(200).send(await exists(request.params.courseId));
    },
    async createCourse(request, reply) {
      scope(request);
      const input = { title: request.body.title, description: request.body.description ?? null };
      const value = await once(
        store,
        `${principal(request).id}:createCourse:${request.headers["idempotency-key"]}`,
        input,
        async (client) => {
          const row = (
            await client.query(
              "INSERT INTO courses(title,description,owner_id) VALUES($1,$2,$3) RETURNING id",
              [input.title, input.description, principal(request).id],
            )
          ).rows[0];
          // Read through the same transaction before it commits.
          const result = (
            await client.query(
              'SELECT id,title,description,owner_id AS "ownerId",version,published,created_at AS "createdAt" FROM courses WHERE id=$1',
              [row.id],
            )
          ).rows[0];
          result.createdAt = result.createdAt.toISOString();
          return { status: 201, result };
        },
      );
      const result = value.result as import("../generated/types.gen.ts").Course;
      return reply.header("Location", `/courses/${result.id}`).code(201).send(result);
    },
    async updateCourse(request, reply) {
      await own(request, request.params.courseId);
      const body = request.body;
      await store.pool.query(
        "UPDATE courses SET title=COALESCE($2,title), description=CASE WHEN $3 THEN $4 ELSE description END,version=version+1 WHERE id=$1",
        [
          request.params.courseId,
          body.title ?? null,
          Object.hasOwn(body, "description"),
          body.description ?? null,
        ],
      );
      return reply.code(200).send((await store.getCourse(request.params.courseId))!);
    },
    async deleteCourse(request, reply) {
      await own(request, request.params.courseId);
      await store.pool.query("DELETE FROM courses WHERE id=$1", [request.params.courseId]);
      return reply.code(204).send();
    },
    async getLesson(request, reply) {
      const row = (
        await store.pool.query(
          'SELECT id,course_id AS "courseId",title FROM lessons WHERE id=$1 AND course_id=$2',
          [request.params.lessonId, request.params.courseId],
        )
      ).rows[0];
      if (!row) fail(404, "Lesson not found");
      return reply.code(200).send(row);
    },
    async getUserCourses(request, reply) {
      user(request, request.params.userId);
      const rows = (
        await store.pool.query(
          "SELECT course_id FROM enrollments WHERE user_id=$1 ORDER BY course_id",
          [request.params.userId],
        )
      ).rows;
      const data = (await Promise.all(rows.map((row) => store.getCourse(row.course_id)))).filter(
        (x): x is NonNullable<typeof x> => Boolean(x),
      );
      return reply
        .code(200)
        .send({ data, meta: { count: data.length }, links: { self: request.url, next: null } });
    },
    async addUserCourse(request, reply) {
      user(request, request.params.userId);
      await exists(request.params.courseId);
      await store.pool.query("INSERT INTO enrollments VALUES($1,$2) ON CONFLICT DO NOTHING", [
        request.params.userId,
        request.params.courseId,
      ]);
      return reply.code(204).send();
    },
    async removeUserCourse(request, reply) {
      user(request, request.params.userId);
      await exists(request.params.courseId);
      await store.pool.query("DELETE FROM enrollments WHERE user_id=$1 AND course_id=$2", [
        request.params.userId,
        request.params.courseId,
      ]);
      return reply.code(204).send();
    },
    async replaceUserCourses(request, reply) {
      user(request, request.params.userId);
      for (const id of request.body.courseIds) await exists(id);
      const client = await store.pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("DELETE FROM enrollments WHERE user_id=$1", [request.params.userId]);
        for (const id of new Set(request.body.courseIds))
          await client.query("INSERT INTO enrollments VALUES($1,$2)", [request.params.userId, id]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      return reply.code(204).send();
    },
    async uploadCover(request, reply) {
      await own(request, request.params.courseId);
      const content = Buffer.isBuffer(request.body)
        ? request.body
        : Buffer.from(await request.body.arrayBuffer());
      if (!content.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
        fail(400, "Invalid PNG signature");
      const row = (
        await store.pool.query(
          "INSERT INTO files(course_id,content) VALUES($1,$2) ON CONFLICT(course_id) DO UPDATE SET content=EXCLUDED.content RETURNING id,content",
          [request.params.courseId, content],
        )
      ).rows[0];
      return reply.code(201).send(fileInfo(row));
    },
    async getCover(request, reply) {
      const row = (
        await store.pool.query("SELECT id,content FROM files WHERE course_id=$1", [
          request.params.courseId,
        ])
      ).rows[0];
      if (!row) fail(404, "Cover not found");
      return reply.code(200).send(fileInfo(row));
    },
    async getFileContent(request, reply) {
      const row = (
        await store.pool.query("SELECT content FROM files WHERE id=$1", [request.params.fileId])
      ).rows[0];
      if (!row) fail(404, "File not found");
      return reply.code(200).type("image/png").send(row.content);
    },
    async downloadFile(request, reply) {
      if (
        !(await store.pool.query("SELECT id FROM files WHERE id=$1", [request.params.fileId]))
          .rowCount
      )
        fail(404, "File not found"); // Hey API classifies 303 as a non-success response; use the framework reply at this binary/redirect boundary.
      return (reply as FastifyReply)
        .header("Location", `/files/${request.params.fileId}/content`)
        .code(303)
        .send("");
    },
    async getMe(request, reply) {
      return reply.code(200).send({ id: principal(request).id, scopes: principal(request).scopes });
    },
    async createExport(request, reply) {
      const value = await once(
        store,
        `${principal(request).id}:createExport:${request.headers["idempotency-key"]}`,
        request.body,
        async (client) => {
          const id = randomUUID();
          await client.query(
            "INSERT INTO operations(id,user_id,status,format) VALUES($1,$2,'pending',$3)",
            [id, principal(request).id, request.body.format],
          );
          return { status: 202, result: { id, status: "pending", resultUrl: null, error: null } };
        },
      );
      const result = value.result as import("../generated/types.gen.ts").Operation;
      return reply.header("Location", `/operations/${result.id}`).code(202).send(result);
    },
    async getOperation(request, reply) {
      const row = (
        await store.pool.query("SELECT * FROM operations WHERE id=$1 AND user_id=$2", [
          request.params.operationId,
          principal(request).id,
        ])
      ).rows[0];
      if (!row) fail(404, "Operation not found");
      return reply.code(200).send(operation(row));
    },
    async getExportResult(request, reply) {
      const row = (
        await store.pool.query("SELECT * FROM operations WHERE id=$1 AND user_id=$2", [
          request.params.operationId,
          principal(request).id,
        ])
      ).rows[0];
      if (!row) fail(404, "Operation not found");
      if (row.status !== "succeeded") fail(409, "Result not ready");
      return reply
        .code(200)
        .type(row.format === "csv" ? "text/csv" : "application/json")
        .send(row.result);
    },
    async publishCourse(request, reply) {
      await own(request, request.params.courseId);
      const client = await store.pool.connect();
      try {
        await client.query("BEGIN");
        const row = (
          await client.query(
            "UPDATE courses SET published=true,version=version+1 WHERE id=$1 AND version=$2 RETURNING id",
            [request.params.courseId, request.body.expectedVersion],
          )
        ).rows[0];
        if (!row) fail(409, "Resource version changed");
        const id = randomUUID();
        await client.query("INSERT INTO events(id,body) VALUES($1,$2)", [
          id,
          JSON.stringify({
            id,
            type: "course.published",
            courseId: row.id,
          } satisfies import("../webhooks/generated/types.gen.ts").WebhookEvent),
        ]);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
      return reply.code(200).send((await store.getCourse(request.params.courseId))!);
    },
  } satisfies RouteHandlers;
}
