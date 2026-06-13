import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Clock, Coins, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Start Tuduvia free. Simple personal tasks, temporary teams, and small-team task management with future paid and credit-based plans planned later.",
};

const freeFeatures = ["Personal task list", "Temporary teams", "Team invites", "Task assignment", "Due dates and priorities", "Comments and files", "Notifications", "Momentum", "Mobile-friendly web app"];

const faqs = [
  { question: "Is Tuduvia free now?", answer: "Yes. Tuduvia is free to use now while we grow the user base and learn from real personal users and small teams." },
  { question: "Why free first?", answer: "Simple tools spread when people can try them without friction. Tuduvia is following that adoption-first path before adding paid plans." },
  { question: "Will paid plans arrive later?", answer: "Yes, paid or credit-based plans may come later for higher usage, advanced features, or larger team needs. They are not active today." },
  { question: "Can I use Tuduvia for a business today?", answer: "Yes. Small teams can start now with the current free plan and keep the workflow simple." },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Badge>Free plan available now</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Start free. Keep it simple.</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">
            Tuduvia is free to use now for personal tasks, temporary projects, and small teams. Paid and credit-based plans can come later after the community grows.
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
              <span className="pb-2 text-sm text-muted-foreground">for now</span>
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
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-5">
            <Sparkles className="h-5 w-5 text-warning" />
            <h2 className="mt-3 font-semibold">Simple adoption</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">A free plan helps Tuduvia spread through personal users, students, homes, and small teams.</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <Clock className="h-5 w-5 text-brand" />
            <h2 className="mt-3 font-semibold">No pressure deadline</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Use Tuduvia now for real work while future plans are shaped by actual demand.</p>
          </div>
          <div className="rounded-lg border border-border bg-background p-5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h2 className="mt-3 font-semibold">Clear promise</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">No Boards. No Training. The free plan keeps the main workflow focused on getting tasks done.</p>
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
