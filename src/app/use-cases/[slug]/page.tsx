import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, HelpCircle, ListChecks } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getUseCase, useCases } from "@/lib/marketing/use-cases";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return useCases.map((useCase) => ({ slug: useCase.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) return { title: "Use case" };
  return {
    title: useCase.title,
    description: useCase.description,
    alternates: { canonical: `/use-cases/${useCase.slug}` },
  };
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="border-b border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <Badge>{useCase.eyebrow}</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">{useCase.title}</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">{useCase.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "px-7")}>{useCase.cta} <ArrowRight /></Link>
              <Link href="/use-cases" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "px-7")}>View all use cases</Link>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-5 shadow-soft">
            <p className="text-sm font-semibold">Persona workflow</p>
            <div className="mt-4 grid gap-3">
              {useCase.workflow.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border border-border bg-surface/65 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">{index + 1}</span>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Pain points</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">Why this work gets messy</h2>
          <div className="mt-6 grid gap-3">
            {useCase.painPoints.map((pain) => (
              <div key={pain} className="flex gap-3 rounded-lg border border-border bg-surface/75 p-4">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <p className="text-sm leading-6 text-muted-foreground">{pain}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Example case study</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">{useCase.scenarioTitle}</h2>
          <p className="mt-4 rounded-lg border border-border bg-surface/75 p-5 text-sm leading-7 text-muted-foreground">{useCase.scenario}</p>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Relevant features</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">The small set of tools this workflow needs.</h2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCase.features.map((feature) => (
              <div key={feature} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <p className="text-sm leading-6 text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <ListChecks className="mx-auto h-6 w-6 text-brand" />
          <h2 className="mt-3 text-3xl font-semibold leading-tight">Questions from {useCase.audience.toLowerCase()}</h2>
        </div>
        <div className="mt-8 grid gap-3">
          {useCase.faq.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-border bg-surface/75 p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-2xl font-semibold">No Boards. No Training.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Start with one task. Invite people only when the work becomes shared.</p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 px-7")}>Start free <ArrowRight /></Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
