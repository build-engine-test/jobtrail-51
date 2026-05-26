// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import type { Application } from "@/lib/db/schema";

const { updateApplicationStageMock, deleteApplicationMock } = vi.hoisted(
  () => ({
    updateApplicationStageMock: vi.fn(async () => ({
      ok: true as const,
      data: {} as Application,
    })),
    deleteApplicationMock: vi.fn(async () => ({
      ok: true as const,
      data: { id: "11111111-1111-4111-8111-111111111111" },
    })),
  }),
);

vi.mock("@/app/_actions/applications", () => ({
  updateApplicationStage: updateApplicationStageMock,
  deleteApplication: deleteApplicationMock,
}));

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { ApplicationRow } from "./application-row";

const baseApp: Application = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "user-1",
  company: "Acme",
  role: "Engineer",
  url: "https://example.com",
  dateApplied: "2026-05-01",
  stage: "applied",
  notes: null,
  createdAt: new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-01T00:00:00Z"),
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  updateApplicationStageMock.mockClear();
  deleteApplicationMock.mockClear();
});

describe("stage_change_calls_action", () => {
  it("calls updateApplicationStage with {id, stage:'interviewing'} exactly once when the select changes", async () => {
    render(<ApplicationRow application={baseApp} />);

    const select = screen.getByLabelText("Stage", {
      selector: "select",
    }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "interviewing" } });

    await new Promise((r) => setTimeout(r, 0));

    expect(updateApplicationStageMock).toHaveBeenCalledTimes(1);
    expect(updateApplicationStageMock).toHaveBeenCalledWith({
      id: baseApp.id,
      stage: "interviewing",
    });
  });
});

describe("delete_confirms_before_calling", () => {
  it("does NOT call deleteApplication if window.confirm returns false", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ApplicationRow application={baseApp} />);

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    await new Promise((r) => setTimeout(r, 0));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteApplicationMock).not.toHaveBeenCalled();
  });

  it("calls deleteApplication when window.confirm returns true", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<ApplicationRow application={baseApp} />);

    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    fireEvent.click(deleteBtn);

    await new Promise((r) => setTimeout(r, 0));

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteApplicationMock).toHaveBeenCalledTimes(1);
    expect(deleteApplicationMock).toHaveBeenCalledWith({ id: baseApp.id });
  });
});
