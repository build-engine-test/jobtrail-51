import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import {
  getStageCounts,
  listApplicationsForUser,
} from "@/lib/db/queries";
import { SignOutButton } from "./sign-out-button";
import { StageCounts } from "./stage-counts";
import { ApplicationsList } from "./applications-list";

export const metadata = {
  title: "Your applications · JobTrail",
  description: "Track every job application from saved to offer.",
};

// Dashboard reflects per-user data; never serve a stale cached render.
export const dynamic = "force-dynamic";

/**
 * Authenticated dashboard.
 *
 * Server component. Resolves the current session, then loads the
 * authenticated user's applications and per-stage counts in parallel —
 * the two queries are independent, so doing them sequentially would
 * needlessly compound latency.
 */
export default async function DashboardPage() {
  const session = await getSession();
  // The layout already redirects unauthenticated visitors, but we guard
  // here too so the type system and the rendered page never trust a
  // missing session.
  if (!session) {
    redirect("/sign-in");
  }

  const [applications, counts] = await Promise.all([
    listApplicationsForUser(session.user.id),
    getStageCounts(session.user.id),
  ]);

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

      <StageCounts counts={counts} />

      <ApplicationsList applications={applications} />
    </div>
  );
}
