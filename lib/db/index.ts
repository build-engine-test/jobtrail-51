import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // We intentionally throw lazily — module import must not crash test
  // runners or build-time tooling that don't need a live database.
  // Consumers calling `db.*` queries without DATABASE_URL set will get
  // a clear error when the underlying postgres client tries to connect.
}

/**
 * Singleton postgres-js client. In dev, Next.js hot-reload would
 * otherwise create a new pool on every request.
 */
declare global {
  // eslint-disable-next-line no-var
  var __jobtrail_pg: ReturnType<typeof postgres> | undefined;
}

const client =
  global.__jobtrail_pg ??
  postgres(databaseUrl ?? "postgres://invalid:invalid@localhost:5432/invalid", {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  global.__jobtrail_pg = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Database = typeof db;
