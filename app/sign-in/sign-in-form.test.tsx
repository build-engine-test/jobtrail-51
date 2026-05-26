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

// Mock the Better Auth client. The form must call authClient.signIn.email.
const signInEmailMock = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => signInEmailMock(...args),
    },
  },
  signIn: { email: (...args: unknown[]) => signInEmailMock(...args) },
}));

// Import after the mocks so the form picks them up.
import { SignInForm } from "./sign-in-form";

beforeEach(() => {
  cleanup();
  pushMock.mockReset();
  signInEmailMock.mockReset();
});

describe("renders_signin_form", () => {
  it("shows heading, email/password inputs, and a submit button", () => {
    render(<SignInForm />);

    expect(
      screen.getByRole("heading", { level: 1, name: /sign in/i }),
    ).toBeTruthy();

    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(email).toBeTruthy();
    expect(email.type).toBe("email");

    const password = screen.getByLabelText(/password/i) as HTMLInputElement;
    expect(password).toBeTruthy();
    expect(password.type).toBe("password");

    const submit = screen.getByRole("button", {
      name: /sign in|log in/i,
    });
    expect(submit).toBeTruthy();
    expect((submit as HTMLButtonElement).type).toBe("submit");
  });
});

describe("redirects_on_success", () => {
  it("calls router.push('/dashboard') when authClient.signIn.email resolves successfully", async () => {
    signInEmailMock.mockResolvedValueOnce({ data: { user: { id: "u1" } }, error: null });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /sign in|log in/i }),
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });

    expect(signInEmailMock).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "supersecret123",
    });
  });
});

describe("shows_inline_error", () => {
  it("renders the rejection message inline when sign in fails", async () => {
    signInEmailMock.mockRejectedValueOnce({ message: "Invalid credentials" });

    render(<SignInForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "supersecret123" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /sign in|log in/i }),
    );

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeTruthy();
    });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
