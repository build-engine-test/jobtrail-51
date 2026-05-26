import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client.
 *
 * Reads NEXT_PUBLIC_BETTER_AUTH_URL when present so deployments behind a
 * custom domain can override the inferred origin. Falls back to relative
 * URLs at runtime when none is provided (Better Auth's default behavior).
 */
const baseURL =
  process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_URL ||
  undefined;

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
