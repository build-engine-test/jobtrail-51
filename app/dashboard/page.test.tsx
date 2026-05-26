// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const getSessionMock = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => getSessionMock(),
}));

const listApplicationsForUserMock = vi.fn();
const getStageCountsMock = vi.fn();
vi.mock("@/lib/db/queries", () => ({
  listApplicationsForUser: (uid: string) => listApplicationsForUserMock(uid),
  getStageCounts: (uid: string) => getStageCountsMock(uid),
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
  listApplicationsForUserMock.mockReset();
  getStageCountsMock.mockReset();
  // Default: empty data so existing shell tests keep working.
  listApplicationsForUserMock.mockResolvedValue([]);
  getStageCountsMock.mockResolvedValue({
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  });
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

describe("empty_state_when_no_rows", () => {
  it("renders the no-applications message with zero counts", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "user@example.com" },
    });
    listApplicationsForUserMock.mockResolvedValue([]);
    getStageCountsMock.mockResolvedValue({
      saved: 0,
      applied: 0,
      interviewing: 0,
      offer: 0,
      rejected: 0,
    });

    const mod = await import("./page");
    const Page = mod.default;

    const ui = await Page();
    render(ui as React.ReactElement);

    expect(
      screen.getByText(/No applications yet — add your first\./i),
    ).toBeTruthy();

    // Every stage card should report 0.
    for (const stage of [
      "saved",
      "applied",
      "interviewing",
      "offer",
      "rejected",
    ]) {
      const card = screen.getByTestId(`stage-card-${stage}`);
      expect(card.textContent ?? "").toContain("0");
    }
  });
});

describe("lists_rows_when_present", () => {
  it("renders both companies when two applications are present", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "u1", email: "user@example.com" },
    });
    listApplicationsForUserMock.mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        userId: "u1",
        company: "Acme Corp",
        role: "Staff Engineer",
        url: "https://acme.example.com/jobs/1",
        dateApplied: "2026-05-01",
        stage: "applied",
        notes: null,
        createdAt: new Date("2026-05-01T12:00:00Z"),
        updatedAt: new Date("2026-05-01T12:00:00Z"),
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        userId: "u1",
        company: "Globex Industries",
        role: "Engineering Manager",
        url: null,
        dateApplied: "2026-04-15",
        stage: "interviewing",
        notes: "Recruiter screen booked.",
        createdAt: new Date("2026-04-15T09:00:00Z"),
        updatedAt: new Date("2026-04-15T09:00:00Z"),
      },
    ]);
    getStageCountsMock.mockResolvedValue({
      saved: 0,
      applied: 1,
      interviewing: 1,
      offer: 0,
      rejected: 0,
    });

    const mod = await import("./page");
    const Page = mod.default;

    const ui = await Page();
    render(ui as React.ReactElement);

    expect(screen.getByText("Acme Corp")).toBeTruthy();
    expect(screen.getByText("Globex Industries")).toBeTruthy();
    expect(
      screen.queryByText(/No applications yet — add your first\./i),
    ).toBeNull();
  });
});
