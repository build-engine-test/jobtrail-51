import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

/**
 * Better Auth server instance.
 *
 * Secrets and base URL are read from the environment at module-load time.
 * NEVER commit a literal value for BETTER_AUTH_SECRET.
 *
 * Required env:
 *   - BETTER_AUTH_SECRET   (long random string, set in Render dashboard)
 *   - BETTER_AUTH_URL      (canonical site URL, e.g. https://app.example.com)
 *   - DATABASE_URL         (Postgres connection string; used by lib/db)
 */
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!secret && process.env.NODE_ENV === "production") {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Refusing to start auth in production " +
      "without a configured secret.",
  );
}

if (!baseURL && process.env.NODE_ENV === "production") {
  throw new Error(
    "BETTER_AUTH_URL is not set. Refusing to start auth in production " +
      "without a configured base URL.",
  );
}

export const auth = betterAuth({
  secret: secret,
  baseURL: baseURL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  advanced: {
    cookiePrefix: "jobtrail",
  },
});

export type Auth = typeof auth;
