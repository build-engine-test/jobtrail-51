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

// During `next build` (page data collection), this module is evaluated even
// though no real request is being served. We must not throw at module-eval
// time during the build -- only when the app is actually running in
// production. Next.js sets NEXT_PHASE=phase-production-build during build.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isProductionRuntime =
  process.env.NODE_ENV === "production" && !isBuildPhase;

if (!secret && isProductionRuntime) {
  throw new Error(
    "BETTER_AUTH_SECRET is not set. Refusing to start auth in production " +
      "without a configured secret.",
  );
}

if (!baseURL && isProductionRuntime) {
  throw new Error(
    "BETTER_AUTH_URL is not set. Refusing to start auth in production " +
      "without a configured base URL.",
  );
}

export const auth = betterAuth({
  // During the build phase we may not have the real secret/baseURL yet;
  // use safe placeholders so module evaluation does not crash. Runtime
  // values are enforced by the guards above.
  secret: secret ?? (isBuildPhase ? "build-time-placeholder-secret" : undefined),
  baseURL: baseURL ?? (isBuildPhase ? "http://localhost:3000" : undefined),
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
