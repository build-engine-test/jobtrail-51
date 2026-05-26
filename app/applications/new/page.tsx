import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { NewApplicationForm } from "./new-application-form";

export const metadata = {
  title: "Add application · JobTrail",
  description: "Track a new job application from saved to offer.",
};

/**
 * /applications/new — auth-gated entry point for creating a new
 * application. The page is a server component; the form itself is the
 * client component that owns the input state and calls the
 * createApplication server action.
 */
export default async function NewApplicationPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-svh bg-background px-4 py-12">
      <NewApplicationForm />
    </main>
  );
}
