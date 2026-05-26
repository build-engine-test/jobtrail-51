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

// Mock the server action module. The form must call createApplication.
const createApplicationMock = vi.fn();
vi.mock("@/app/_actions/applications", () => ({
  createApplication: (...args: unknown[]) => createApplicationMock(...args),
}));

// Import after mocks so the form picks them up.
import { NewApplicationForm } from "./new-application-form";

beforeEach(() => {
  cleanup();
  pushMock.mockReset();
  createApplicationMock.mockReset();
});

describe("renders_all_fields", () => {
  it("renders inputs for company, role, url, date applied, notes, and a submit button", () => {
    render(<NewApplicationForm />);

    const company = screen.getByLabelText(/company/i) as HTMLInputElement;
    expect(company).toBeTruthy();
    expect(company.tagName).toBe("INPUT");

    const role = screen.getByLabelText(/role/i) as HTMLInputElement;
    expect(role).toBeTruthy();
    expect(role.tagName).toBe("INPUT");

    const url = screen.getByLabelText(/url/i) as HTMLInputElement;
    expect(url).toBeTruthy();
    expect(url.tagName).toBe("INPUT");

    const dateApplied = screen.getByLabelText(
      /date applied/i,
    ) as HTMLInputElement;
    expect(dateApplied).toBeTruthy();
    expect(dateApplied.tagName).toBe("INPUT");
    expect(dateApplied.type).toBe("date");

    const notes = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
    expect(notes).toBeTruthy();
    expect(notes.tagName).toBe("TEXTAREA");

    const submit = screen.getByRole("button", {
      name: /add application|save|create/i,
    });
    expect(submit).toBeTruthy();
    expect((submit as HTMLButtonElement).type).toBe("submit");
  });
});

describe("shows_field_errors", () => {
  it("renders fieldErrors adjacent to the matching input when the server action returns ok:false", async () => {
    createApplicationMock.mockResolvedValueOnce({
      ok: false,
      error: "validation_failed",
      fieldErrors: { company: "Required" },
    });

    render(<NewApplicationForm />);

    fireEvent.change(screen.getByLabelText(/role/i), {
      target: { value: "Software Engineer" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /add application|save|create/i,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeTruthy();
    });

    // The error should be associated with the company field via aria-describedby
    // or be rendered as a sibling of the company input under the same wrapper.
    const company = screen.getByLabelText(/company/i) as HTMLInputElement;
    const errorEl = screen.getByText(/required/i);
    // Walk up until we find a shared ancestor with company input.
    let ancestor: HTMLElement | null = errorEl.parentElement;
    let found = false;
    while (ancestor) {
      if (ancestor.contains(company)) {
        found = true;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    expect(found).toBe(true);

    expect(pushMock).not.toHaveBeenCalled();
  });
});
