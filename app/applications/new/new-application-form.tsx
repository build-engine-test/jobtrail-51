"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createApplication } from "@/app/_actions/applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Local today-in-ISO helper. Computes the user's local date as
 * "YYYY-MM-DD" so the default for `dateApplied` matches the calendar
 * day the user sees, not UTC. We intentionally don't use
 * `toISOString().slice(0, 10)` because that returns the UTC date and is
 * off-by-one for users in negative-UTC timezones late in the day.
 */
function todayLocalIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type FormState = {
  company: string;
  role: string;
  url: string;
  dateApplied: string;
  notes: string;
};

const initialState = (): FormState => ({
  company: "",
  role: "",
  url: "",
  dateApplied: todayLocalIso(),
  notes: "",
});

export function NewApplicationForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      try {
        const result = await createApplication({
          company: values.company,
          role: values.role,
          url: values.url,
          dateApplied: values.dateApplied,
          stage: "applied",
          notes: values.notes,
        });

        if (result.ok) {
          router.push("/dashboard");
          return;
        }

        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }

        if (result.error === "unauthorized") {
          setFormError("Your session has expired. Please sign in again.");
        } else if (result.error === "server_error") {
          setFormError("Something went wrong. Please try again.");
        } else if (result.error === "validation_failed" && !result.fieldErrors) {
          setFormError("Please check the form for errors.");
        }
      } catch {
        setFormError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Add application
          </h1>
          <p className="text-sm text-muted-foreground">
            Track a new role from saved to offer.
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="rounded-xl border bg-card p-6 shadow-sm sm:p-8"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              name="company"
              type="text"
              required
              autoComplete="organization"
              value={values.company}
              onChange={(e) => update("company", e.target.value)}
              aria-invalid={fieldErrors.company ? true : undefined}
              aria-describedby={
                fieldErrors.company ? "company-error" : undefined
              }
              disabled={isPending}
              placeholder="Acme, Inc."
            />
            {fieldErrors.company ? (
              <p
                id="company-error"
                role="alert"
                className="text-sm text-rose-600"
              >
                {fieldErrors.company}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              name="role"
              type="text"
              required
              autoComplete="off"
              value={values.role}
              onChange={(e) => update("role", e.target.value)}
              aria-invalid={fieldErrors.role ? true : undefined}
              aria-describedby={fieldErrors.role ? "role-error" : undefined}
              disabled={isPending}
              placeholder="Senior Software Engineer"
            />
            {fieldErrors.role ? (
              <p
                id="role-error"
                role="alert"
                className="text-sm text-rose-600"
              >
                {fieldErrors.role}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">
              URL <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="url"
              name="url"
              type="url"
              autoComplete="url"
              value={values.url}
              onChange={(e) => update("url", e.target.value)}
              aria-invalid={fieldErrors.url ? true : undefined}
              aria-describedby={fieldErrors.url ? "url-error" : undefined}
              disabled={isPending}
              placeholder="https://example.com/jobs/123"
            />
            {fieldErrors.url ? (
              <p id="url-error" role="alert" className="text-sm text-rose-600">
                {fieldErrors.url}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateApplied">Date applied</Label>
            <Input
              id="dateApplied"
              name="dateApplied"
              type="date"
              required
              value={values.dateApplied}
              onChange={(e) => update("dateApplied", e.target.value)}
              aria-invalid={fieldErrors.dateApplied ? true : undefined}
              aria-describedby={
                fieldErrors.dateApplied ? "dateApplied-error" : undefined
              }
              disabled={isPending}
            />
            {fieldErrors.dateApplied ? (
              <p
                id="dateApplied-error"
                role="alert"
                className="text-sm text-rose-600"
              >
                {fieldErrors.dateApplied}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              name="notes"
              rows={5}
              value={values.notes}
              onChange={(e) => update("notes", e.target.value)}
              aria-invalid={fieldErrors.notes ? true : undefined}
              aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
              disabled={isPending}
              placeholder="Recruiter contact, referral, interview prep links..."
            />
            {fieldErrors.notes ? (
              <p
                id="notes-error"
                role="alert"
                className="text-sm text-rose-600"
              >
                {fieldErrors.notes}
              </p>
            ) : null}
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-rose-600"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button asChild variant="outline" disabled={isPending}>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add application"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewApplicationForm;
