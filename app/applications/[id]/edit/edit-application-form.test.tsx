// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";

// Mock next/navigation router.push used by the form.
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock the server action module. The form must call updateApplication.
const updateApplicationMock = vi.fn();
vi.mock("@/app/_actions/applications", () => ({
  updateApplication: (...args: unknown[]) => updateApplicationMock(...args),
}));

// Import after mocks so the form picks them up.
import { EditApplicationForm } from "./edit-application-form";

const baseInitial = {
  id: "11111111-1111-1111-1111-111111111111",
  company: "Acme",
  role: "SWE",
  url: "https://example.com/jobs/1",
  dateApplied: "2026-05-01",
  stage: "applied" as const,
  notes: "follow up next week",
};

beforeEach(() => {
  cleanup();
  pushMock.mockReset();
  updateApplicationMock.mockReset();
});

describe("form_prefilled", () => {
  it("renders the Company input with value 'Acme' and Role with 'SWE'", () => {
    render(<EditApplicationForm initial={baseInitial} />);

    const company = screen.getByLabelText(/company/i) as HTMLInputElement;
    expect(company).toBeTruthy();
    expect(company.value).toBe("Acme");

    const role = screen.getByLabelText(/role/i) as HTMLInputElement;
    expect(role).toBeTruthy();
    expect(role.value).toBe("SWE");

    const url = screen.getByLabelText(/url/i) as HTMLInputElement;
    expect(url.value).toBe("https://example.com/jobs/1");

    const dateApplied = screen.getByLabelText(
      /date applied/i,
    ) as HTMLInputElement;
    expect(dateApplied.value).toBe("2026-05-01");

    const notes = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
    expect(notes.value).toBe("follow up next week");
  });
});

describe("submit_calls_update", () => {
  it("calls updateApplication with the id and merged fields; on ok=true the router pushes to /dashboard", async () => {
    updateApplicationMock.mockResolvedValueOnce({
      ok: true,
      data: { ...baseInitial, company: "Acme Updated" },
    });

    render(<EditApplicationForm initial={baseInitial} />);

    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: "Acme Updated" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /save|update/i }),
    );

    await waitFor(() => {
      expect(updateApplicationMock).toHaveBeenCalledTimes(1);
    });

    const call = updateApplicationMock.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    expect(call.id).toBe(baseInitial.id);
    expect(call.company).toBe("Acme Updated");
    expect(call.role).toBe("SWE");
    expect(call.url).toBe("https://example.com/jobs/1");
    expect(call.dateApplied).toBe("2026-05-01");
    expect(call.stage).toBe("applied");
    expect(call.notes).toBe("follow up next week");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });
});
