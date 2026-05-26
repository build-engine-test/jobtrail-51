// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const getSessionMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => getSessionMock(),
}));

// Avoid pulling in the real Better Auth client (and its env requirements)
// when the page mounts the Sign out button.
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(async () => ({ data: null, error: null })),
  },
  signOut: vi.fn(async () => ({ data: null, error: null })),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
}));

beforeEach(() => {
  cleanup();
  getSessionMock.mockReset();
});

describe("shell_renders_when_authed", () => {
  it("renders 'Your applications' heading and an 'Add application' link to /applications/new", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "user@example.com" },
    });

    const mod = await import("./page");
    const Page = mod.default;

    // Server components return JSX synchronously or async — call and await.
    const ui = await Page();
    render(ui as React.ReactElement);

    expect(
      screen.getByRole("heading", { level: 1, name: /your applications/i }),
    ).toBeTruthy();

    const addLinks = screen.getAllByRole("link", {
      name: /add application/i,
    });
    expect(addLinks.length).toBeGreaterThan(0);
    for (const link of addLinks) {
      expect((link as HTMLAnchorElement).getAttribute("href")).toBe(
        "/applications/new",
      );
    }
  });

  it("renders a sign-out control", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "user@example.com" },
    });

    const mod = await import("./page");
    const Page = mod.default;

    const ui = await Page();
    render(ui as React.ReactElement);

    expect(
      screen.getByRole("button", { name: /sign out/i }),
    ).toBeTruthy();
  });
});
