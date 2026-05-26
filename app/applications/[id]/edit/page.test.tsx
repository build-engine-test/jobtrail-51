// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

const getSessionMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => getSessionMock(),
}));

const getApplicationByIdMock = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  getApplicationByIdForUser: (id: string, userId: string) =>
    getApplicationByIdMock(id, userId),
}));

const notFoundMock = vi.fn(() => {
  throw new Error("__NEXT_NOT_FOUND__");
});
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: () => notFoundMock(),
  redirect: (...args: unknown[]) => redirectMock(...args),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  cleanup();
  getSessionMock.mockReset();
  getApplicationByIdMock.mockReset();
  notFoundMock.mockClear();
  redirectMock.mockReset();
});

describe("not_found_for_other_users_row", () => {
  it("calls notFound() when the query returns null (row owned by another user)", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "user@example.com" },
    });
    // Query is scoped by (id, userId) — when the row belongs to a
    // different user it simply returns null.
    getApplicationByIdMock.mockResolvedValue(null);

    const mod = await import("./page");
    const Page = mod.default;

    await expect(
      Page({
        params: Promise.resolve({
          id: "11111111-1111-1111-1111-111111111111",
        }),
      }),
    ).rejects.toThrow(/__NEXT_NOT_FOUND__/);

    expect(notFoundMock).toHaveBeenCalled();
    expect(getApplicationByIdMock).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "u1",
    );
  });
});
