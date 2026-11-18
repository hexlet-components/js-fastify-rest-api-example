import Fastify from "fastify";

const app = Fastify();
app.get("/health", async () => ({ status: "ok" }));
const address = await app.listen({ port: 3000, host: "127.0.0.1" });
console.log(address);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close();
  });
}
