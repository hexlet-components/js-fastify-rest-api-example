import type { User } from "../types/index.ts";

export default class UserSerializer {
  index(users: User[]) {
    return { data: users, meta: {} };
  }
}
