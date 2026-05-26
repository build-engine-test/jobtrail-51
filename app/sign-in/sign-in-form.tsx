"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInError = { message?: string } | Error | unknown;

function extractMessage(err: SignInError): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setError(null);
    setPending(true);

    try {
      const result = (await authClient.signIn.email({
        email,
        password,
      })) as { error?: { message?: string } | null } | undefined;

      // Better Auth's React client typically returns { data, error }.
      if (result && result.error) {
        setError(extractMessage(result.error));
        setPending(false);
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      setError(extractMessage(err));
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back. Sign in to your JobTrail account.
          </p>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={pending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              disabled={pending}
            />
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-rose-600"
            >
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignInForm;
