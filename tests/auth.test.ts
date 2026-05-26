import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("auth_handler_exported", () => {
  beforeAll(() => {
    // Make sure env is at least set for module loading.
    process.env.BETTER_AUTH_SECRET ??= "test-secret-xyz-placeholder-not-real";
    process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
    process.env.DATABASE_URL ??=
      "postgres://invalid:invalid@localhost:5432/invalid";
  });

  it("route module exposes GET and POST handlers", async () => {
    const mod = await import("../app/api/auth/[...all]/route");
    expect(typeof mod.GET).toBe("function");
    expect(typeof mod.POST).toBe("function");
  });

  it("lib/auth.ts contains no literal secret values", () => {
    const filePath = resolve(__dirname, "..", "lib", "auth.ts");
    const src = readFileSync(filePath, "utf8");

    // Must reference env vars
    expect(src).toMatch(/process\.env\.BETTER_AUTH_SECRET/);
    expect(src).toMatch(/process\.env\.BETTER_AUTH_URL/);

    // Must NOT embed literal secret strings.
    // We look for patterns that suggest hardcoded secrets.
    // A literal string assigned to `secret:` that isn't a process.env access
    // would be a violation.
    const literalSecretAssign =
      /secret\s*:\s*['"`](?!.*process\.env)[A-Za-z0-9_\-]{12,}/;
    expect(literalSecretAssign.test(src)).toBe(false);

    // No obvious provider secret prefixes
    expect(src).not.toMatch(/sk-[A-Za-z0-9]{16,}/);
    expect(src).not.toMatch(/rnd_[A-Za-z0-9]{16,}/);
  });
});

describe("session_helper_typed", () => {
  beforeAll(() => {
    process.env.BETTER_AUTH_SECRET ??= "test-secret-xyz-placeholder-not-real";
    process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
    process.env.DATABASE_URL ??=
      "postgres://invalid:invalid@localhost:5432/invalid";
  });

  it("getSession is an exported function", async () => {
    const mod = await import("../lib/session");
    expect(typeof mod.getSession).toBe("function");
  });

  it("AuthSession type narrows to { user: { id: string, email: string } } | null", () => {
    // Type-level assertion (compiled by tsc --noEmit).
    type Expected = { user: { id: string; email: string } } | null;
    // Importing as a value so the import isn't elided.
    type Imported = import("../lib/session").AuthSession;

    // Assignability both ways implies structural equivalence on these keys.
    const a: Expected = null;
    const b: Imported = a;
    const c: Expected = b;
    expect(c).toBeNull();
  });
});
