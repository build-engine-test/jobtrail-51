import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Catch-all route handler for Better Auth.
 *
 * Better Auth ships an integration helper that converts its internal
 * request handler into Next.js App Router `{ GET, POST }` exports. All
 * sign-in / sign-up / session / sign-out / callback traffic flows through
 * this single endpoint at /api/auth/*.
 */
export const { GET, POST } = toNextJsHandler(auth);

// We never want this endpoint cached — every request carries fresh
// session state via cookies.
export const dynamic = "force-dynamic";
