import { BarChart3, Briefcase, Target } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HeroMesh } from "@/components/ui/hero-mesh";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * JobTrail landing page. Links into the real app (sign up / log in); the
 * authenticated dashboard, applications CRUD, and pipeline live behind auth.
 */
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">JobTrail</span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Log in</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <section className="relative isolate overflow-hidden px-6 pb-24 pt-16 sm:pt-24">
        <HeroMesh />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Every job application, in one place.
          </h1>
          <p className="mt-6 text-pretty text-lg text-muted-foreground sm:text-xl">
            Track each role from saved to offer on a simple board. Add an
            application, move it through the pipeline, and always know exactly
            where you stand.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Briefcase className="size-6 text-primary" />
            <CardTitle className="mt-4">Track every application</CardTitle>
            <CardDescription>
              Add a role with company, link, date applied, and notes. No more
              hunting through email and spreadsheets.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Target className="size-6 text-primary" />
            <CardTitle className="mt-4">Move it through the pipeline</CardTitle>
            <CardDescription>
              Saved, Applied, Interviewing, Offer, Rejected. Update a status in
              one click and see your whole funnel at a glance.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <BarChart3 className="size-6 text-primary" />
            <CardTitle className="mt-4">Know where you stand</CardTitle>
            <CardDescription>
              A dashboard counts how many applications sit in each stage so you
              can see momentum and what needs a follow-up.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
