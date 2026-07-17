import { drizzle } from "drizzle-orm/mysql2";
import { env } from "../lib/env";
import * as schema from "@db/schema";
import * as relations from "@db/relations";

const fullSchema = { ...schema, ...relations };

let instance: ReturnType<typeof drizzle<typeof fullSchema>>;

export function getDb() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!instance) {
    // mode "default" works with standard MySQL (Railway, generic hosts).
    // "planetscale" is only for TiDB/PlanetScale-style servers.
    const isPlanetScale = /pscale|privatelink|tidb/i.test(env.databaseUrl);
    instance = drizzle(env.databaseUrl, {
      mode: isPlanetScale ? "planetscale" : "default",
      schema: fullSchema,
    });
  }
  return instance;
}
