import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useCases } from "@/lib/marketing/use-cases";
import { breadcrumbSchema, collectionPageSchema, faqSchema, itemListSchema, pageMetadata } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pageTitle = "Tuduvia Use Cases - Simple Tasks for Personal Life and Small Teams";
const pageDescription = "Explore Tuduvia use cases for personal to-do lists, school projects, home tasks, small businesses, non-IT teams, temporary teams, freelancers, events, and more.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/use-cases",
});

const faqs = [
  { question: "What can I use Tuduvia for?", answer: "Use Tuduvia for personal tasks, school projects, home tasks, friend plans, small business work, non-IT team workflows, and short-term teams." },
  { question: "Is Tuduvia only for work teams?", answer: "No. Tuduvia starts as a personal to-do list and becomes a shared team space only when the task needs other people." },
  { question: "Which use case should I start with?", answer: "Start with the page closest to your real situation. The workflow stays simple across all use cases: write the task, add an owner when needed, and finish it." },
  { question: "Do these workflows need setup or training?", answer: "No. Tuduvia is designed for people who need a clear task list without boards, project management language, or training." },
];

export default function UseCasesPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          collectionPageSchema({ path: "/use-cases", name: pageTitle, description: pageDescription }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Use cases", path: "/use-cases" },
          ]),
          itemListSchema(useCases.map((useCase) => ({
            name: useCase.title,
            path: `/use-cases/${useCase.slug}`,
            description: useCase.description,
          }))),
          faqSchema(faqs),
        ]}
      />
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
        <section className="mt-14">
          <h2 className="text-center text-3xl font-semibold">Use case questions</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-border bg-surface/75 p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
      <MarketingFooter />
    </main>
  );
}
