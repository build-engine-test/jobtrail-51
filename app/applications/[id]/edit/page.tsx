import { notFound, redirect } from "next/navigation";

import { getApplicationByIdForUser } from "@/lib/db/queries";
import { getSession } from "@/lib/session";
import { EditApplicationForm } from "./edit-application-form";

export const metadata = {
  title: "Edit application · JobTrail",
  description: "Update the details of a tracked job application.",
};

/**
 * UUID-shape check. Matches the `uuidField` regex used in the validation
 * layer so we can short-circuit obviously malformed ids with a 404 before
 * touching the database. We don't want to leak whether a row exists.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Format a `Date | string` value coming out of Postgres as a `YYYY-MM-DD`
 * string suitable for an `<input type="date">`. The `date` column type is
 * a calendar day with no timezone, so we render it as-is and refuse to
 * round-trip through UTC.
 */
function toIsoDate(value: Date | string): string {
  if (typeof value === "string") {
    // Already a YYYY-MM-DD string (postgres `date` returns this with the
    // `pg` driver). Trim to the first 10 chars in case of trailing time.
    return value.slice(0, 10);
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * /applications/[id]/edit — auth-gated edit page. Fetches the row
 * scoped to the session user; missing rows or rows owned by someone
 * else 404 so we never leak existence.
 */
export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Cheap auth check first — don't bother resolving params if we're
  // about to redirect anyway.
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }

  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    notFound();
  }

  const application = await getApplicationByIdForUser(id, session.user.id);
  if (!application) {
    notFound();
  }

  const initial = {
    id: application.id,
    company: application.company,
    role: application.role,
    url: application.url,
    dateApplied: toIsoDate(application.dateApplied),
    stage: application.stage,
    notes: application.notes,
  };

  return (
    <main className="min-h-svh bg-background px-4 py-12">
      <EditApplicationForm initial={initial} />
    </main>
  );
}
