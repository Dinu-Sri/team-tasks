import type { Metadata } from "next";
import { ArrowRight, Building2, CheckCircle2, Handshake, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbSchema, faqSchema, pageMetadata, webPageSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pageTitle = "Tuduvia Pricing - Start Free, Upgrade When Your Team Grows";
const pageDescription = "Start Tuduvia free for simple tasks and small teams. Upgrade for more members, storage, workspace controls, branding, support, and business setup.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/pricing",
});

const plans = [
  {
    name: "Free",
    badge: "Start here",
    price: "Free",
    text: "For personal tasks, students, families, and very small teams.",
    icon: CheckCircle2,
    features: ["1 workspace", "Up to 3 members", "200 active tasks", "100 MB storage", "30-day history", "Basic team tasks"],
  },
  {
    name: "Team Starter",
    badge: "Small teams",
    price: "LKR 2,500/mo",
    text: "For small businesses and active teams that need more room.",
    icon: Users,
    features: ["Up to 7 members", "2,000 active tasks", "2 GB storage", "50 MB file uploads", "1-year history", "Standard support"],
  },
  {
    name: "Business",
    badge: "Growing teams",
    price: "LKR 7,500/mo",
    text: "For organizations that need branding, higher limits, and admin controls.",
    icon: Building2,
    features: ["Up to 5 workspaces", "Up to 25 members", "10,000 active tasks", "10 GB storage", "Organization branding", "Priority support"],
  },
];

const faqs = [
  { question: "Can I still use Tuduvia for free?", answer: "Yes. The Free plan remains available for personal use, students, families, and very small teams." },
  { question: "What happens if I reach a limit?", answer: "Your existing work stays safe. Tuduvia blocks only new items such as extra members, tasks, or uploads until usage is reduced or the workspace is upgraded." },
  { question: "Do you support custom setup?", answer: "Yes. Tuduvia can be configured for a business, department, clinic, school group, or service team with paid setup support." },
  { question: "How do paid upgrades work?", answer: "Workspace owners can upgrade with PayHere when online checkout is enabled. Manual upgrades and custom setup are still available through Tuduvia support." },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          webPageSchema({ path: "/pricing", name: "Start free, upgrade when your team grows.", description: pageDescription }),
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
          <Badge>Simple pricing</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Start free, upgrade when the team grows.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">
            Tuduvia stays easy for personal tasks and small teams, then adds paid limits, branding, support, and setup help when work becomes serious.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className="flex flex-col rounded-lg border border-border bg-surface p-6 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant={plan.name === "Free" ? "success" : "secondary"}>{plan.badge}</Badge>
                  <h2 className="mt-4 text-2xl font-semibold">{plan.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.text}</p>
                </div>
                <plan.icon className="h-6 w-6 text-brand" />
              </div>
              <p className="mt-6 text-3xl font-semibold">{plan.price}</p>
              <ul className="mt-6 grid gap-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.name === "Free" ? "/signup" : "/dashboard/billing"} className={cn(buttonVariants({ variant: plan.name === "Free" ? "default" : "secondary" }), "mt-6 w-full")}>
                {plan.name === "Free" ? "Start free" : "Upgrade in app"} <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-5 py-16 sm:px-8 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-5">
            <Handshake className="h-5 w-5 text-brand" />
            <h2 className="mt-3 font-semibold">Custom setup</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Need Tuduvia mapped to your team process? We can help with workspace setup, onboarding, migration, and workflow design.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <ShieldCheck className="h-5 w-5 text-success" />
            <h2 className="mt-3 font-semibold">Safe upgrades and downgrades</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Downgrades do not delete existing work. Tuduvia limits new activity until the workspace fits the selected plan.
            </p>
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
