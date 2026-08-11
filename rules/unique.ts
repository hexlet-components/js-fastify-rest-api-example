import { eq } from "drizzle-orm";
import { checkAsync } from "valibot";
import type { DrizzleDB, DrizzleSchema } from "../types/index.ts";

type Options = {
  schema: DrizzleSchema;
  field: string;
};

export default function unique(db: DrizzleDB, options: Options) {
  return checkAsync(async (value: string) => {
    const [row] = await db
      .select()
      .from(options.schema)
      // @ts-expect-error index signature for dynamic column access
      .where(eq(options.schema[options.field], value));
    return !row;
  });
}
