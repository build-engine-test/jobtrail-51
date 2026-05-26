import Link from "next/link";
import { Plus, Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

export const metadata = {
  title: "Your applications · JobTrail",
  description: "Track every job application from saved to offer.",
};

/**
 * Dashboard placeholder.
 *
 * This is the auth-gated shell only — the real list, counts, and
 * pipeline view land in the next epic. For now we render the page
 * chrome, the empty state, and the entry points users need from day
 * one (add an application, sign out).
 */
export default async function DashboardPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your applications
          </h1>
          <p className="text-sm text-muted-foreground">
            Track every job application from saved to offer on one board.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link href="/applications/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add application
            </Link>
          </Button>
          <SignOutButton />
        </div>
      </header>

      <section
        aria-labelledby="empty-state-heading"
        className="rounded-xl border bg-card p-12 shadow-sm"
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-muted p-4">
            <Inbox
              className="h-6 w-6 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <h2
            id="empty-state-heading"
            className="text-xl font-medium"
          >
            No applications yet
          </h2>
          <p className="text-sm text-muted-foreground">
            Add your first job application to start tracking it through the
            pipeline: Saved, Applied, Interviewing, Offer, and Rejected.
          </p>
          <Button asChild variant="outline">
            <Link href="/applications/new">
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
              Add application
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
