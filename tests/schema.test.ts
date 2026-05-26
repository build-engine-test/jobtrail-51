import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

describe("schema_compiles", () => {
  it("exports applications table, applicationStage enum, and Application type from lib/db/schema", async () => {
    const mod = await import("../lib/db/schema");
    expect(mod.applications).toBeDefined();
    expect(mod.applicationStage).toBeDefined();

    // Application type is a TS-only construct; assert that we can construct
    // a shape that conforms to the inferred select type via runtime use of
    // the column references. The fact that this file compiles under tsc
    // --noEmit (gate 1) already proves the type exports work; here we only
    // need to verify the runtime symbols.
    type App = import("../lib/db/schema").Application;
    type NewApp = import("../lib/db/schema").NewApplication;
    const _typecheck: App | NewApp | null = null;
    expect(_typecheck).toBeNull();

    // applicationStage should be a pgEnum with the canonical stage values
    const enumValues = (mod.applicationStage as { enumValues?: readonly string[] }).enumValues;
    expect(enumValues).toEqual([
      "saved",
      "applied",
      "interviewing",
      "offer",
      "rejected",
    ]);
  });

  it("re-exports Better Auth tables (user, session, account, verification)", async () => {
    const mod = await import("../lib/db/schema");
    expect(mod.user).toBeDefined();
    expect(mod.session).toBeDefined();
    expect(mod.account).toBeDefined();
    expect(mod.verification).toBeDefined();
  });
});

describe("migration_has_enum_and_indexes", () => {
  it("generates drizzle SQL with the application_stage enum, applications table, and three indexes", () => {
    const drizzleDir = path.resolve(__dirname, "..", "drizzle");
    expect(existsSync(drizzleDir), "drizzle/ directory must exist").toBe(true);

    const files = readdirSync(drizzleDir).filter((f) => f.endsWith(".sql"));
    expect(files.length, "at least one .sql migration must exist").toBeGreaterThan(0);

    const combined = files
      .map((f) => readFileSync(path.join(drizzleDir, f), "utf8"))
      .join("\n");

    // Enum
    expect(combined).toMatch(/CREATE TYPE\s+(?:"public"\.)?"?application_stage"?\s+AS ENUM\s*\(\s*'saved'\s*,\s*'applied'\s*,\s*'interviewing'\s*,\s*'offer'\s*,\s*'rejected'\s*\)/i);

    // Table with all NOT NULL columns
    expect(combined).toMatch(/CREATE TABLE\s+"?applications"?/i);
    expect(combined).toMatch(/"?id"?\s+uuid[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?user_?Id"?\s+text[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?company"?\s+text[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?role"?\s+text[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?date_?Applied"?\s+date[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?stage"?\s+"?application_stage"?[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?created_?At"?\s+timestamp[^,]*NOT NULL/i);
    expect(combined).toMatch(/"?updated_?At"?\s+timestamp[^,]*NOT NULL/i);

    // Three indexes
    expect(combined).toMatch(/applications_user_idx/i);
    expect(combined).toMatch(/applications_user_stage_idx/i);
    expect(combined).toMatch(/applications_user_date_idx/i);
  });
});
