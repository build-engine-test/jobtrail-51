import type { StageCounts as StageCountsMap } from "@/lib/db/queries";
import type { ApplicationStage } from "@/lib/validation/application";

/**
 * Visual pipeline summary across the five stages, plus a total card.
 *
 * Pure presentational server component: it does not fetch its own data
 * because the dashboard page parallelises that with the row query.
 */

const STAGE_DISPLAY: ReadonlyArray<{
  stage: ApplicationStage;
  label: string;
}> = [
  { stage: "saved", label: "Saved" },
  { stage: "applied", label: "Applied" },
  { stage: "interviewing", label: "Interviewing" },
  { stage: "offer", label: "Offer" },
  { stage: "rejected", label: "Rejected" },
];

export interface StageCountsProps {
  counts: StageCountsMap;
}

export function StageCounts({ counts }: StageCountsProps) {
  const total =
    counts.saved +
    counts.applied +
    counts.interviewing +
    counts.offer +
    counts.rejected;

  return (
    <section aria-label="Application pipeline summary">
      <ol className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {STAGE_DISPLAY.map(({ stage, label }) => (
          <li
            key={stage}
            data-testid={`stage-card-${stage}`}
            className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-muted/40"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>
            <p
              className="mt-2 text-3xl font-semibold tabular-nums font-mono text-foreground"
              aria-label={`${label}: ${counts[stage]}`}
            >
              {counts[stage]}
            </p>
          </li>
        ))}
        <li
          data-testid="stage-card-total"
          className="rounded-xl border border-primary/40 bg-primary/5 p-6 shadow-sm"
        >
          <p className="text-sm font-medium text-primary">Total</p>
          <p
            className="mt-2 text-3xl font-semibold tabular-nums font-mono text-foreground"
            aria-label={`Total: ${total}`}
          >
            {total}
          </p>
        </li>
      </ol>
    </section>
  );
}
