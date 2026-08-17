import { eq } from "drizzle-orm";
import type { DrizzleDB, DrizzleSchema } from "../types/index.ts";

type Options = {
  schema: DrizzleSchema;
  field: string;
};

// Проверка уникальности это единственное правило, которое нельзя выразить в
// OpenAPI: она зависит от состояния базы. Возвращается предикат для .refine(),
// поэтому правило подключается к любой строковой схеме zod.
export default function unique(db: DrizzleDB, options: Options) {
  return async (value: string) => {
    const [row] = await db
      .select()
      .from(options.schema)
      // @ts-expect-error index signature for dynamic column access
      .where(eq(options.schema[options.field], value));
    return !row;
  };
}
