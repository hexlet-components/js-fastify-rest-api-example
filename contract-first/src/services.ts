import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import type { Store } from "./db.ts";
export function fail(statusCode: number, detail: string): never {
  throw Object.assign(new Error(detail), { statusCode });
}
export function problem(status: number, detail: string) {
  return {
    type: `https://example.org/problems/${status}`,
    title: status >= 500 ? "Internal Server Error" : "Request failed",
    status,
    detail,
  };
}
// The advisory lock covers concurrent requests and separate server processes.
// The operation and its replay record commit together in one PostgreSQL transaction.
export async function once(
  store: Store,
  scope: string,
  body: unknown,
  perform: (client: import("pg").PoolClient) => Promise<{ status: number; result: unknown }>,
) {
  const client = await store.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [scope]);
    await client.query("DELETE FROM idempotency WHERE scope=$1 AND expires_at<=now()", [scope]);
    const old = (await client.query("SELECT * FROM idempotency WHERE scope=$1", [scope])).rows[0];
    // Canonical model field order makes semantically identical JSON stable.
    const canonical = JSON.stringify(body);
    if (old) {
      if (old.body !== canonical) fail(409, "Key already used with a different body");
      await client.query("COMMIT");
      return { status: old.status as number, result: old.result };
    }
    const value = await perform(client);
    await client.query("INSERT INTO idempotency VALUES ($1,$2,$3,$4,now()+interval '24 hours')", [
      scope,
      canonical,
      value.status,
      JSON.stringify(value.result),
    ]);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function runExports(store: Store, forceFailure = false) {
  const jobs = await store.pool.query(
    "UPDATE operations SET status='running' WHERE status='pending' RETURNING *",
  );
  for (const job of jobs.rows) {
    if (forceFailure) {
      await store.pool.query("UPDATE operations SET status='failed',error=$2 WHERE id=$1", [
        job.id,
        JSON.stringify(problem(500, "Export failed")),
      ]);
      continue;
    }
    const rows = await store.db.select().from((await import("./db.ts")).courses);
    const data = rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt).toISOString() }));
    const result =
      job.format === "csv"
        ? "id,title\n" + data.map((row) => `${row.id},${JSON.stringify(row.title)}`).join("\n")
        : data;
    await store.pool.query("UPDATE operations SET status='succeeded',result=$2 WHERE id=$1", [
      job.id,
      JSON.stringify(result),
    ]);
  }
}
export function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("hex");
}
export function verify(body: string, signature: string, secret: string) {
  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function deliverEvents(store: Store, url: string, secret: string) {
  const events = await store.pool.query("SELECT * FROM events WHERE delivered=false");
  for (const event of events.rows) {
    const raw = JSON.stringify(event.body);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-signature": sign(raw, secret),
        "x-event-id": event.id,
      },
      body: raw,
    });
    if (response.ok)
      await store.pool.query("UPDATE events SET delivered=true WHERE id=$1", [event.id]);
  }
}
export { randomUUID };
