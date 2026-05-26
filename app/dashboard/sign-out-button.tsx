"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Sign out control rendered inside the dashboard shell.
 *
 * Calls Better Auth's `authClient.signOut()` to clear the session cookie
 * server-side, then redirects to /sign-in. Errors are surfaced inline via
 * an aria-live region rather than a toast, so screen readers pick them up
 * and we don't pull in toast infrastructure for a single action.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (pending) return;

    setError(null);
    setPending(true);

    try {
      await authClient.signOut();
      router.push("/sign-in");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Could not sign out. Please try again.";
      setError(message);
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        disabled={pending}
      >
        {pending ? "Signing out..." : "Sign out"}
      </Button>
      {error ? (
        <p
          role="alert"
          className="text-sm text-rose-600"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default SignOutButton;
