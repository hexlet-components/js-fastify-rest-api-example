import jwt from "fast-jwt";
import { devSecret } from "../src/app.ts";
const sign = jwt.createSigner({
  key: process.env.JWT_SECRET ?? devSecret,
  expiresIn: process.env.TOKEN_TTL ?? "1h",
});
console.log(
  sign({
    id: Number(process.argv[2] ?? 1),
    scopes: (process.argv[3] ?? "courses:write").split(",").filter(Boolean),
  }),
);
