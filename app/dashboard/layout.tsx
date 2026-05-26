import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getSession } from "@/lib/session";

/**
 * Auth gate for every /dashboard/** route.
 *
 * Resolves the current session on the server and redirects unauthenticated
 * visitors to /sign-in before any nested page renders. Children are
 * rendered inside a centered layout shell so individual pages don't have
 * to repeat the chrome.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">{children}</div>
    </div>
  );
}
