import type { RouteHandlers } from "../types/handlers/fastify.gen.ts";
import lessons from "./api/courses/lessons.ts";
import courses from "./api/courses.ts";
import tokens from "./api/tokens.ts";
import users from "./api/users.ts";
import root from "./root.ts";

const serviceHandlers: Partial<RouteHandlers> = {
  ...root,
  ...users,
  ...courses,
  ...lessons,
  ...tokens,
};

export default serviceHandlers;
