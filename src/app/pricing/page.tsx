import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Clock, Coins, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbSchema, faqSchema, freePlanOfferSchema, pageMetadata, webPageSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pageTitle = "Tuduvia Pricing - Start Free With Simple Tasks and Teams";
const pageDescription = "Start Tuduvia free with personal task lists, temporary teams, assignments, due dates, comments, files, notifications, and mobile-friendly access. No hidden fees today.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/pricing",
});

const freeFeatures = ["Personal task list", "Temporary teams", "Team invites", "Task assignment", "Due dates and priorities", "Comments and files", "Notifications", "Momentum", "Mobile-friendly web app"];
const freeUseCases = [
  { label: "Personal users", href: "/use-cases/simple-personal-todo-list" },
  { label: "Students", href: "/use-cases/school-project-task-list" },
  { label: "Families", href: "/use-cases/home-family-task-list" },
  { label: "Small businesses", href: "/use-cases/small-business-task-management" },
  { label: "Non-IT teams", href: "/use-cases/non-it-team-task-management" },
  { label: "Temporary teams", href: "/use-cases/temporary-team-task-management" },
];

const faqs = [
  { question: "Is Tuduvia free?", answer: "Yes. All features are free — personal tasks, team tasks, comments, files, notifications, momentum, and mobile access. No hidden fees." },
  { question: "Why is it free?", answer: "We believe the best productivity tools should be accessible to everyone. Simple task management shouldn't require a subscription." },
  { question: "Will paid plans arrive later?", answer: "We may add optional credit-based plans for advanced capabilities in the future, but today every feature is free and available." },
  { question: "Can I use Tuduvia for a business?", answer: "Yes. Small businesses, teams, freelancers, and organizations can start today with all features included." },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          webPageSchema({ path: "/pricing", name: "Start free. Keep it simple.", description: pageDescription }),
          freePlanOfferSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pricing", path: "/pricing" },
          ]),
          faqSchema(faqs),
        ]}
      />
      <MarketingHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>All features included</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Start free. Keep it simple.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">
            Tuduvia is free — personal tasks, team tasks, comments, files, notifications, momentum, and mobile access. All included. No hidden fees.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-lg border border-brand/35 bg-surface p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">Free</h2>
                <p className="mt-1 text-sm text-muted-foreground">For personal use, temporary projects, and small teams starting today.</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-semibold">$0</span>
              <span className="pb-2 text-sm text-muted-foreground">free forever</span>
            </div>
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full")}>
              Start free <ArrowRight />
            </Link>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {freeFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <FuturePlan icon={Coins} title="Credits" text="Planned for future high-usage or advanced capabilities that should stay flexible instead of forcing every user into a subscription." />
          <FuturePlan icon={Users} title="Team Plus" text="Planned for larger teams that may need stronger controls, limits, or admin features after Tuduvia grows." />
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-5">
            <Sparkles className="h-5 w-5 text-warning" />
            <h2 className="mt-3 font-semibold">Everything included</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Personal to-do lists, team tasks, comments, files, notifications, momentum, and mobile access — all free.</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="mt-3 font-semibold">Built to stay simple</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Tuduvia focuses on the shortest path from to-do to done. No feature bloat, no training needed.</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h2 className="mt-3 font-semibold">No hidden fees</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No credit card needed. No surprise charges. Just a simple task app that works.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">Who can use the free plan?</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              The free plan is enough to test Tuduvia in real life: start with your own list, create a temporary group for one project, or invite a small team when the work becomes shared.
            </p>
            <Link href="/use-cases" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-5")}>Explore all use cases</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {freeUseCases.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg border border-border bg-surface/75 p-4 text-sm font-semibold transition-colors hover:border-brand/50 hover:bg-surface">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-center text-3xl font-semibold leading-tight sm:text-4xl">Pricing FAQ</h2>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-border bg-surface/75 p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

function FuturePlan({ icon: Icon, title, text }: { icon: typeof Coins; title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/65 p-6">
      <Badge variant="secondary">Coming later</Badge>
      <Icon className="mt-5 h-6 w-6 text-brand" />
      <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
    </div>
  );
}
