import { type Config } from "drizzle-kit";

import { env } from "@/env";

const baseConfig = {
  schema: "./src/server/db/schema.ts",
} satisfies Pick<Config, "schema">;

export default (
  env.DATABASE_AUTH_TOKEN
    ? {
        ...baseConfig,
        dialect: "turso",
        dbCredentials: {
          authToken: env.DATABASE_AUTH_TOKEN,
          url: env.DATABASE_URL,
        },
      }
    : {
        ...baseConfig,
        dialect: "sqlite",
        dbCredentials: {
          url: env.DATABASE_URL,
        },
      }
) satisfies Config;
