// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks must be declared before importing the modules under test.
const getSessionMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => getSessionMock(),
}));

const revalidatePathMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidatePathMock(path),
}));

// Build a chainable Drizzle-like db mock whose returned promise resolves
// with whatever the caller has queued via the *Result helpers. Each call
// to insert/update/delete/select returns a fresh chain so we can spy on
// .where() / .values() / .set() invocations per-call.
type Spy = ReturnType<typeof vi.fn>;
interface Chain {
  values: Spy;
  set: Spy;
  where: Spy;
  from: Spy;
  groupBy: Spy;
  returning: Spy;
  then: (
    onfulfilled?: (value: unknown) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => Promise<unknown>;
}
const chainCalls: {
  insert: Chain[];
  update: Chain[];
  delete: Chain[];
  select: Chain[];
} = { insert: [], update: [], delete: [], select: [] };

const queuedResults: {
  insert: unknown[];
  update: unknown[];
  delete: unknown[];
  select: unknown[];
} = { insert: [], update: [], delete: [], select: [] };

function makeChain(kind: keyof typeof chainCalls): Chain {
  const result = queuedResults[kind].shift() ?? [];
  const chain: Chain = {
    values: vi.fn(() => chain),
    set: vi.fn(() => chain),
    where: vi.fn(() => chain),
    from: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    returning: vi.fn(() => chain),
    then: (onfulfilled, onrejected) =>
      Promise.resolve(result).then(onfulfilled, onrejected),
  };
  chainCalls[kind].push(chain);
  return chain;
}

const dbInsertSpy = vi.fn(() => makeChain("insert"));
const dbUpdateSpy = vi.fn(() => makeChain("update"));
const dbDeleteSpy = vi.fn(() => makeChain("delete"));
const dbSelectSpy = vi.fn(() => makeChain("select"));

vi.mock("@/lib/db", () => ({
  db: {
    insert: dbInsertSpy,
    update: dbUpdateSpy,
    delete: dbDeleteSpy,
    select: dbSelectSpy,
  },
}));

beforeEach(() => {
  getSessionMock.mockReset();
  revalidatePathMock.mockReset();
  dbInsertSpy.mockClear();
  dbUpdateSpy.mockClear();
  dbDeleteSpy.mockClear();
  dbSelectSpy.mockClear();
  chainCalls.insert.length = 0;
  chainCalls.update.length = 0;
  chainCalls.delete.length = 0;
  chainCalls.select.length = 0;
  queuedResults.insert.length = 0;
  queuedResults.update.length = 0;
  queuedResults.delete.length = 0;
  queuedResults.select.length = 0;
});

describe("create_requires_auth", () => {
  it("returns unauthorized when there is no session and never touches the db", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const { createApplication } = await import("./applications");

    const result = await createApplication({
      company: "Acme",
      role: "Engineer",
      url: "",
      dateApplied: "2026-05-01",
      stage: "saved",
      notes: "",
    });

    expect(result).toEqual({ ok: false, error: "unauthorized" });
    expect(dbInsertSpy).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("create_validates_input", () => {
  it("returns ok:false with fieldErrors.company set when company is empty", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u1", email: "a@b.test" },
    });

    const { createApplication } = await import("./applications");

    const result = await createApplication({
      company: "",
      role: "Engineer",
      url: "",
      dateApplied: "2026-05-01",
      stage: "saved",
      notes: "",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors).toBeDefined();
      expect(result.fieldErrors?.company).toBeTruthy();
    }
    // Validation failures must NOT issue a DB write.
    expect(dbInsertSpy).not.toHaveBeenCalled();
  });
});

describe("update_is_user_scoped", () => {
  it("includes both id and userId in the update where clause", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "user-42", email: "a@b.test" },
    });
    // Drizzle .returning() resolves to the rows.
    queuedResults.update.push([
      {
        id: "11111111-1111-1111-1111-111111111111",
        userId: "user-42",
        company: "Acme",
        role: "Engineer",
        url: null,
        dateApplied: "2026-05-01",
        stage: "applied",
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { updateApplication } = await import("./applications");

    const result = await updateApplication({
      id: "11111111-1111-1111-1111-111111111111",
      company: "Acme",
      role: "Engineer",
      url: "",
      dateApplied: "2026-05-01",
      stage: "applied",
      notes: "",
    });

    expect(result.ok).toBe(true);
    expect(chainCalls.update.length).toBe(1);
    const updChain = chainCalls.update[0];
    expect(updChain.set).toHaveBeenCalledTimes(1);
    expect(updChain.where).toHaveBeenCalledTimes(1);

    // The where predicate must reference BOTH id and userId. We can't
    // easily inspect Drizzle's SQL AST, so we serialize the argument and
    // assert both column names appear.
    const whereArg = updChain.where.mock.calls[0][0];
    const seen = new WeakSet<object>();
    const serialized = JSON.stringify(whereArg, (_k, v) => {
      if (typeof v === "function") return "[fn]";
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[circular]";
        seen.add(v);
      }
      return v;
    });
    // Drizzle's `and(eq(applications.id, X), eq(applications.userId, Y))`
    // serializes column references via their `.name` property.
    expect(serialized).toMatch(/userId/);
    expect(serialized).toMatch(/"id"|\bid\b/);
    // And the session's user id must appear somewhere in the bound values.
    expect(serialized).toContain("user-42");
    expect(serialized).toContain("11111111-1111-1111-1111-111111111111");
  });
});

describe("stage_counts_groups_correctly", () => {
  it("returns all 5 stage keys present (zero for empty ones)", async () => {
    queuedResults.select.push([
      { stage: "saved", count: 3 },
      { stage: "applied", count: 2 },
      // interviewing, offer, rejected omitted by the DB
    ]);

    const { getStageCounts } = await import("@/lib/db/queries");

    const counts = await getStageCounts("user-42");

    expect(counts).toEqual({
      saved: 3,
      applied: 2,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    });
    expect(chainCalls.select.length).toBe(1);
    const selChain = chainCalls.select[0];
    expect(selChain.from).toHaveBeenCalledTimes(1);
    expect(selChain.where).toHaveBeenCalledTimes(1);
    expect(selChain.groupBy).toHaveBeenCalledTimes(1);
  });
});
