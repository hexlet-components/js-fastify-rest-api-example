import { buildServer } from "./app.ts";
const app = await buildServer({
  runJobs: true,
  seed: process.env.NODE_ENV !== "production",
  rateLimit: process.env.RATE_LIMIT === "true",
  failExports: process.env.FAIL_EXPORTS === "true",
  webhookUrl: process.env.WEBHOOK_URL,
});
await app.listen({ port: Number(process.env.PORT ?? 3000), host: process.env.HOST ?? "127.0.0.1" });
console.log(app.listeningOrigin);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    void app.close();
  });
