import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useCases } from "@/lib/marketing/use-cases";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "Explore Tuduvia workflows for personal to-do lists, school projects, home tasks, small businesses, non-IT teams, temporary teams, and more.",
};

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <Badge>20 focused workflows</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Find the Tuduvia page that sounds like your life.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">
            Start as one person with a simple list. Invite people when the work becomes a school project, family task, neighbor plan, business workflow, or temporary team.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((useCase) => (
            <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className="rounded-lg border border-border bg-surface/75 p-5 transition-colors hover:border-brand/60 hover:bg-surface">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{useCase.audience}</p>
              <h2 className="mt-2 font-semibold">{useCase.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{useCase.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">Open guide <ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-2xl font-semibold">The simplest path is still the same.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Write the task, add the owner when needed, finish the work.</p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 px-7")}>Start free</Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
