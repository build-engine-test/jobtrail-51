import { headers } from "next/headers";
import { auth } from "./auth";

/**
 * Typed view of an authenticated session as exposed to server-side code.
 *
 * We intentionally narrow Better Auth's richer session payload down to the
 * fields the rest of the app actually relies on, so callers get a stable
 * contract regardless of upstream changes.
 */
export type AuthSession = {
  user: {
    id: string;
    email: string;
  };
} | null;

/**
 * Read the current request's session via Better Auth's server API.
 *
 * Returns `null` when the user is not signed in, the session cookie is
 * absent / invalid / expired, or any error occurs while resolving the
 * session. Callers are expected to treat `null` as "unauthenticated" and
 * either render a public view or redirect to /sign-in.
 *
 * This MUST only be called from server components, route handlers, or
 * server actions — `headers()` is unavailable on the client.
 */
export async function getSession(): Promise<AuthSession> {
  try {
    const result = await auth.api.getSession({
      headers: await headers(),
    });

    if (!result || !result.user) {
      return null;
    }

    const { id, email } = result.user;
    if (typeof id !== "string" || typeof email !== "string") {
      return null;
    }

    return {
      user: { id, email },
    };
  } catch (err) {
    // Defensive: never let an auth-layer hiccup crash a page render.
    // Log to stderr so operators can diagnose in Render logs, but
    // surface "no session" to the caller.
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[getSession] failed to resolve session:", err);
    }
    return null;
  }
}
