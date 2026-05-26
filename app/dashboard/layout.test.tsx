// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const getSessionMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => getSessionMock(),
}));

const redirectMock = vi.fn((path: string) => {
  // Match Next.js behavior: redirect() throws to short-circuit rendering.
  throw new Error(`NEXT_REDIRECT:${path}`);
});
vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

beforeEach(() => {
  getSessionMock.mockReset();
  redirectMock.mockClear();
});

describe("unauth_redirects", () => {
  it("calls redirect('/sign-in') when getSession returns null", async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const mod = await import("./layout");
    const Layout = mod.default;

    await expect(
      Promise.resolve().then(() =>
        Layout({ children: null as unknown as React.ReactNode }),
      ),
    ).rejects.toThrow(/NEXT_REDIRECT:\/sign-in/);

    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("does not redirect when a session is present", async () => {
    getSessionMock.mockResolvedValueOnce({
      user: { id: "u1", email: "user@example.com" },
    });

    const mod = await import("./layout");
    const Layout = mod.default;

    const result = await Layout({
      children: "child-node" as unknown as React.ReactNode,
    });

    expect(redirectMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});
