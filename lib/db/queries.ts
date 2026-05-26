import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./index";
import { applications, type Application } from "./schema";
import {
  APPLICATION_STAGES,
  type ApplicationStage,
} from "@/lib/validation/application";

/**
 * Per-stage tally for a single user. Keys are exhaustive — every stage in
 * the canonical pipeline appears, even when the user has zero rows in
 * that stage. Consumers can rely on `counts[stage]` being a number.
 */
export type StageCounts = Record<ApplicationStage, number>;

/**
 * List every application owned by the given user, newest first.
 *
 * Scoped by `userId` at the SQL level — authorization is the route
 * handler / action's responsibility, but this helper can be safely
 * passed a user id that came from a verified session.
 */
export async function listApplicationsForUser(
  userId: string,
): Promise<Application[]> {
  return db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.dateApplied), desc(applications.createdAt));
}

/**
 * Return a `{ stage: count }` map for the given user using a single
 * grouped query (`select stage, count(*) from applications where
 * userId = $1 group by stage`). Stages with zero rows are filled in
 * with 0 so callers can render the dashboard without nullish checks.
 */
export async function getStageCounts(userId: string): Promise<StageCounts> {
  const rows = (await db
    .select({
      stage: applications.stage,
      count: sql<number>`count(*)::int`.as("count"),
    })
    .from(applications)
    .where(eq(applications.userId, userId))
    .groupBy(applications.stage)) as Array<{
    stage: ApplicationStage;
    count: number;
  }>;

  const counts: StageCounts = {
    saved: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    rejected: 0,
  };
  for (const row of rows) {
    // Defensive: ignore any unexpected stage value sneaking in from the
    // database — the enum constraint should prevent this, but typed
    // narrowing keeps the return shape honest.
    if ((APPLICATION_STAGES as readonly string[]).includes(row.stage)) {
      counts[row.stage] = Number(row.count) || 0;
    }
  }
  return counts;
}

/**
 * Fetch a single application by id, but only if it belongs to the given
 * user. Returns `null` when no row matches — this collapses the
 * "doesn't exist" and "exists but owned by someone else" cases into a
 * single response, so callers can map either to a 404 without leaking
 * information about other users' rows.
 */
export async function getApplicationByIdForUser(
  id: string,
  userId: string,
): Promise<Application | null> {
  const rows = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}
