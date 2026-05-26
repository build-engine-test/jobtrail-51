"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";

import {
  deleteApplication,
  updateApplicationStage,
} from "@/app/_actions/applications";
import type { Application } from "@/lib/db/schema";
import {
  APPLICATION_STAGES,
  type ApplicationStage,
} from "@/lib/validation/application";

/**
 * Client row for the dashboard. Wires three interactions:
 *   1. Inline <select> bound to updateApplicationStage.
 *   2. <Link> to /applications/[id]/edit.
 *   3. Delete button gated by window.confirm, calls deleteApplication.
 *
 * useTransition powers a pending UI affordance during the server-action
 * round-trip. We intentionally optimistically update the local stage so
 * the UI feels instant; on a server error we roll back.
 */

interface ApplicationRowProps {
  application: Application;
}

const STAGE_LABELS: Record<ApplicationStage, string> = {
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

const STAGE_BADGE_CLASS: Record<ApplicationStage, string> = {
  saved: "bg-muted text-muted-foreground border-border",
  applied: "bg-primary/10 text-primary border-primary/30",
  interviewing:
    "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300",
  offer:
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
  rejected:
    "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300",
};

function formatDate(value: string): string {
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

export function ApplicationRow({ application }: ApplicationRowProps) {
  const [stage, setStage] = useState<ApplicationStage>(application.stage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const stageSelectId = useId();

  const stageLabel = STAGE_LABELS[stage];
  const badgeClass = STAGE_BADGE_CLASS[stage];

  const handleStageChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ): void => {
    const nextStage = event.target.value as ApplicationStage;
    if (nextStage === stage) return;

    const previousStage = stage;
    setStage(nextStage);
    setError(null);

    startTransition(async () => {
      try {
        const result = await updateApplicationStage({
          id: application.id,
          stage: nextStage,
        });
        if (!result.ok) {
          setStage(previousStage);
          setError("Could not update stage. Please try again.");
        }
      } catch {
        setStage(previousStage);
        setError("Could not update stage. Please try again.");
      }
    });
  };

  const handleDelete = (): void => {
    const confirmed = window.confirm(
      `Delete this application for ${application.company}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteApplication({ id: application.id });
        if (!result.ok) {
          setError("Could not delete this application. Please try again.");
        }
      } catch {
        setError("Could not delete this application. Please try again.");
      }
    });
  };

  return (
    <li
      data-testid={`application-row-${application.id}`}
      className={`rounded-xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isPending ? "opacity-70" : ""
      }`}
      aria-busy={isPending}
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

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label
            htmlFor={stageSelectId}
            className="text-sm font-medium text-muted-foreground"
          >
            Stage
          </label>
          <select
            id={stageSelectId}
            value={stage}
            onChange={handleStageChange}
            disabled={isPending}
            className="rounded-md border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60 tabular-nums"
          >
            {APPLICATION_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/applications/${application.id}/edit`}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </li>
  );
}
