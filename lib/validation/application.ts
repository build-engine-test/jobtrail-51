import { z } from "zod";

/**
 * Canonical pipeline stages — must mirror the `application_stage` Postgres
 * enum defined in lib/db/schema.ts. Order matters: it's the user-visible
 * order on the dashboard.
 */
export const APPLICATION_STAGES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type ApplicationStage = (typeof APPLICATION_STAGES)[number];

export const stageEnum = z.enum(APPLICATION_STAGES);

/**
 * URL validation: optional field that, if present, must be a parseable URL.
 * Accepts empty string (treated as "not provided") so HTML forms with an
 * empty input don't trip the validator.
 */
const urlField = z
  .string()
  .max(2048, "URL must be 2048 characters or fewer")
  .optional()
  .or(z.literal(""))
  .refine(
    (val) => {
      if (val === undefined || val === "") return true;
      try {
        // Constructing URL throws on invalid input.
        // eslint-disable-next-line no-new
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL must be a valid http(s) URL" },
  );

/**
 * ISO date (YYYY-MM-DD) validation. We don't want to accept a full
 * timestamp because the column type is `date`, not `timestamp`.
 */
const dateAppliedField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: "Date must be a valid calendar date",
  });

/**
 * Schema for creating a new application. Used by the createApplication
 * server action and the matching client-side form. All free-text fields
 * are trimmed before being checked against length bounds.
 */
export const createApplicationSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Company is required")
    .max(200, "Company must be 200 characters or fewer"),
  role: z
    .string()
    .trim()
    .min(1, "Role is required")
    .max(200, "Role must be 200 characters or fewer"),
  url: urlField,
  dateApplied: dateAppliedField,
  stage: stageEnum,
  notes: z
    .string()
    .max(5000, "Notes must be 5000 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

/**
 * Schema for updating an existing application. The `id` MUST be a uuid —
 * scoping to the session user is enforced at the SQL layer, but rejecting
 * malformed ids early prevents a wasted round-trip.
 */
const uuidField = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "Invalid application id",
  );

export const updateApplicationSchema = createApplicationSchema.extend({
  id: uuidField,
});

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

/**
 * Schema for the lightweight stage-only update used by the dashboard's
 * inline "move card" interaction.
 */
export const updateStageSchema = z.object({
  id: uuidField,
  stage: stageEnum,
});

export type UpdateStageInput = z.infer<typeof updateStageSchema>;

/**
 * Schema for delete — separate from update because we don't want to
 * require every other field just to remove a row.
 */
export const deleteApplicationSchema = z.object({
  id: uuidField,
});

export type DeleteApplicationInput = z.infer<typeof deleteApplicationSchema>;

/**
 * Flatten a ZodError into a `{ fieldName: firstMessage }` map suitable
 * for binding to a form's per-field error UI.
 */
export function flattenFieldErrors(
  err: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    if (!(key in out)) {
      out[key] = issue.message;
    }
  }
  return out;
}
