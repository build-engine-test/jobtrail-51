"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { applications, type Application } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import {
  createApplicationSchema,
  deleteApplicationSchema,
  flattenFieldErrors,
  updateApplicationSchema,
  updateStageSchema,
  type CreateApplicationInput,
  type DeleteApplicationInput,
  type UpdateApplicationInput,
  type UpdateStageInput,
} from "@/lib/validation/application";

/**
 * Discriminated-union result type returned by every server action in this
 * module. Callers can switch on `ok` to get exhaustive narrowing.
 *
 * `error` is a short machine-readable code suitable for switching in the
 * UI ("unauthorized", "not_found", "validation_failed", "server_error").
 * `fieldErrors` is populated only for validation failures and maps form
 * field names to their first error message.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const VALIDATION_FAILED = "validation_failed";
const UNAUTHORIZED = "unauthorized";
const NOT_FOUND = "not_found";
const SERVER_ERROR = "server_error";

/**
 * Normalize zero-length form input into `null` for nullable columns. We
 * intentionally do this in the action layer (not in the validator) so the
 * shape sent over the wire stays string-only.
 */
function emptyToNull(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseOrFail<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): { ok: true; data: z.infer<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        error: VALIDATION_FAILED,
        fieldErrors: flattenFieldErrors(parsed.error),
      },
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Create a new application owned by the currently signed-in user.
 *
 * Returns:
 *  - { ok: false, error: "unauthorized" }       — no session
 *  - { ok: false, error: "validation_failed", fieldErrors } — bad input
 *  - { ok: false, error: "server_error" }       — db threw
 *  - { ok: true,  data: <inserted row> }        — success
 */
export async function createApplication(
  input: CreateApplicationInput,
): Promise<ActionResult<Application>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: UNAUTHORIZED };
  }

  const parsed = parseOrFail(createApplicationSchema, input);
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  try {
    const rows = await db
      .insert(applications)
      .values({
        userId: session.user.id,
        company: data.company,
        role: data.role,
        url: emptyToNull(data.url),
        dateApplied: data.dateApplied,
        stage: data.stage,
        notes: emptyToNull(data.notes),
      })
      .returning();

    const inserted = rows[0];
    if (!inserted) {
      return { ok: false, error: SERVER_ERROR };
    }

    revalidatePath("/dashboard");
    return { ok: true, data: inserted };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[createApplication] db error:", err);
    }
    return { ok: false, error: SERVER_ERROR };
  }
}

/**
 * Update an existing application owned by the signed-in user.
 *
 * The WHERE clause is scoped to BOTH the row id AND the session user id
 * so a hostile client cannot mutate someone else's row by guessing a
 * uuid. We never trust a userId passed from the client.
 */
export async function updateApplication(
  input: UpdateApplicationInput,
): Promise<ActionResult<Application>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: UNAUTHORIZED };
  }

  const parsed = parseOrFail(updateApplicationSchema, input);
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  try {
    const rows = await db
      .update(applications)
      .set({
        company: data.company,
        role: data.role,
        url: emptyToNull(data.url),
        dateApplied: data.dateApplied,
        stage: data.stage,
        notes: emptyToNull(data.notes),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.id, data.id),
          eq(applications.userId, session.user.id),
        ),
      )
      .returning();

    const updated = rows[0];
    if (!updated) {
      return { ok: false, error: NOT_FOUND };
    }

    revalidatePath("/dashboard");
    return { ok: true, data: updated };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[updateApplication] db error:", err);
    }
    return { ok: false, error: SERVER_ERROR };
  }
}

/**
 * Move an application to a new pipeline stage. Lightweight variant of
 * updateApplication used by the dashboard's stage-change interaction.
 */
export async function updateApplicationStage(
  input: UpdateStageInput,
): Promise<ActionResult<Application>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: UNAUTHORIZED };
  }

  const parsed = parseOrFail(updateStageSchema, input);
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  try {
    const rows = await db
      .update(applications)
      .set({
        stage: data.stage,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applications.id, data.id),
          eq(applications.userId, session.user.id),
        ),
      )
      .returning();

    const updated = rows[0];
    if (!updated) {
      return { ok: false, error: NOT_FOUND };
    }

    revalidatePath("/dashboard");
    return { ok: true, data: updated };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[updateApplicationStage] db error:", err);
    }
    return { ok: false, error: SERVER_ERROR };
  }
}

/**
 * Delete an application. Scoped to the signed-in user the same way as
 * update; returns not_found if no row matched (either nonexistent id or
 * belongs to a different user).
 */
export async function deleteApplication(
  input: DeleteApplicationInput,
): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: UNAUTHORIZED };
  }

  const parsed = parseOrFail(deleteApplicationSchema, input);
  if (!parsed.ok) return parsed.result;
  const data = parsed.data;

  try {
    const rows = await db
      .delete(applications)
      .where(
        and(
          eq(applications.id, data.id),
          eq(applications.userId, session.user.id),
        ),
      )
      .returning({ id: applications.id });

    const deleted = rows[0];
    if (!deleted) {
      return { ok: false, error: NOT_FOUND };
    }

    revalidatePath("/dashboard");
    return { ok: true, data: { id: deleted.id } };
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("[deleteApplication] db error:", err);
    }
    return { ok: false, error: SERVER_ERROR };
  }
}
