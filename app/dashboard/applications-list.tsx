"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";

import type { Application } from "@/lib/db/schema";
import type { ApplicationStage } from "@/lib/validation/application";

/**
 * Client list + row component for the dashboard.
 *
 * The page passes a fully-resolved set of rows here; we mark the
 * component as a client island so future epics can layer in optimistic
 * stage-change actions and inline filters without restructuring the
 * page. For v1 this is a read-only rendering.
 */

interface ApplicationsListProps {
  applications: ReadonlyArray<Application>;
}

const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const STAGE_BADGE_CLASS: Record<ApplicationStage, string> = {
  saved:
    "bg-muted text-muted-foreground border-border",
  applied:
    "bg-primary/10 text-primary border-primary/30",
  interviewing:
    "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  offer:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  rejected:
    "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
};

function formatDate(value: string): string {
  // The DB column is `date` and serialises as YYYY-MM-DD. Parse defensively;
  // if it isn't a valid date, just return what we have so the row still
  // renders something readable rather than NaN.
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ApplicationRow({ application }: { application: Application }) {
  const stageLabel = STAGE_LABELS[application.stage];
  const badgeClass = STAGE_BADGE_CLASS[application.stage];

  return (
    <li
      data-testid={`application-row-${application.id}`}
      className="rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium leading-tight">
            {application.company}
          </h3>
          <p className="text-sm text-muted-foreground">{application.role}</p>
          <p className="text-xs text-muted-foreground">
            Applied {formatDate(application.dateApplied)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${badgeClass}`}
            aria-label={`Stage: ${stageLabel}`}
          >
            {stageLabel}
          </span>
          {application.url ? (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View posting
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
      {application.notes ? (
        <p className="mt-4 whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm text-foreground">
          {application.notes}
        </p>
      ) : null}
    </li>
  );
}

export function ApplicationsList({ applications }: ApplicationsListProps) {
  // Stable derived view so future filtering hooks can plug in without
  // re-deriving on every render.
  const rows = useMemo(() => applications, [applications]);

  if (rows.length === 0) {
    return (
      <section
        aria-labelledby="empty-state-heading"
        className="rounded-xl border bg-card p-12 shadow-sm"
      >
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
          <h2 id="empty-state-heading" className="text-xl font-medium">
            No applications yet — add your first.
          </h2>
          <p className="text-sm text-muted-foreground">
            Track each application through the pipeline: Saved, Applied,
            Interviewing, Offer, and Rejected.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Your applications">
      <ol className="grid gap-4">
        {rows.map((application) => (
          <ApplicationRow key={application.id} application={application} />
        ))}
      </ol>
    </section>
  );
}
