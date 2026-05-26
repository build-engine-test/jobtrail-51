// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

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

// Mock the Better Auth client. The form must call authClient.signUp.email.
const signUpEmailMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => signUpEmailMock(...args),
    },
  },
  signUp: { email: (...args: unknown[]) => signUpEmailMock(...args) },
}));

// Import after the mocks so the form picks them up.
import { SignUpForm } from "./sign-up-form";

beforeEach(() => {
  cleanup();
  pushMock.mockReset();
  signUpEmailMock.mockReset();
});

describe("renders_signup_form", () => {
  it("shows heading, email/password inputs, and a submit button", () => {
    render(<SignUpForm />);

    // Heading
    expect(
      screen.getByRole("heading", { level: 1, name: /sign up/i }),
    ).toBeTruthy();

    // Email input (typed input with label "Email")
    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(email).toBeTruthy();
    expect(email.type).toBe("email");

    // Password input
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(password).toBeTruthy();
    expect(password.type).toBe("password");

    // Submit button labeled "Sign up" or "Create account"
    const submit = screen.getByRole("button", {
      name: /sign up|create account/i,
    });
    expect(submit).toBeTruthy();
    expect((submit as HTMLButtonElement).type).toBe("submit");
  });
});

describe("shows_inline_error", () => {
  it("renders the rejection message inline when sign up fails", async () => {
    signUpEmailMock.mockRejectedValueOnce({ message: "Email already in use" });

    render(<SignUpForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /sign up|create account/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeTruthy();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
