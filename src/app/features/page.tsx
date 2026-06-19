import type { Metadata } from "next";
import { ArrowRight, Bell, CheckCircle2, MessageCircle, Paperclip, ShieldCheck, Smartphone, Undo2, UserRound, Users } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { breadcrumbSchema, faqSchema, pageMetadata, webPageSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pageTitle = "Tuduvia Features - Simple Tasks Without Boards";
const pageDescription = "Explore Tuduvia features for personal task lists, temporary teams, assignments, comments, files, notifications, mobile access, and simple task completion.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/features",
});

const features = [
  { icon: UserRound, title: "Personal task list", text: "Start with your own simple list before you invite anyone or create a shared workspace." },
  { icon: Users, title: "Temporary teams", text: "Create a team for a class project, home job, event, client task, or small business workflow." },
  { icon: CheckCircle2, title: "Clear assignment", text: "Put one person on a task so everyone knows who owns the next action." },
  { icon: Bell, title: "Notifications", text: "Keep due tasks, invites, comments, and team changes visible without checking a board all day." },
  { icon: MessageCircle, title: "Task comments", text: "Keep short decisions and updates beside the task instead of losing them in chat." },
  { icon: Paperclip, title: "Files and context", text: "Attach a screenshot, document, or reference when a task needs more than a sentence." },
  { icon: Undo2, title: "Undo completion", text: "Bring a task back when someone completes it by mistake or too early." },
  { icon: Smartphone, title: "Mobile-friendly web app", text: "Read, add, assign, and finish tasks from a phone without installing a separate app." },
];

const simpleFlows = [
  "Add a task in a few seconds.",
  "Assign it only when another person needs to help.",
  "Use comments and files only when the task needs context.",
  "Finish it, undo if needed, and move on.",
];

const faqs = [
  { question: "Does Tuduvia use boards?", answer: "No. Tuduvia is built around simple task lists, clear ownership, and fast completion instead of board setup." },
  { question: "Can I use Tuduvia alone?", answer: "Yes. Tuduvia starts as a personal task list and becomes a team space only when you invite people." },
  { question: "Can non-technical teams use it?", answer: "Yes. Tuduvia avoids project management language so students, families, small businesses, and non-IT teams can understand it quickly." },
  { question: "Are all features free?", answer: "Yes. Tuduvia is currently free for personal tasks, teams, comments, files, notifications, and mobile-friendly access." },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          webPageSchema({ path: "/features", name: pageTitle, description: pageDescription }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Features", path: "/features" },
          ]),
          faqSchema(faqs),
        ]}
      />
      <MarketingHeader />
      <section className="border-b border-border/60 bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Badge variant="success">Simple by design</Badge>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-6xl">Features for getting tasks done, not managing the tool.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl">
              Tuduvia keeps the essentials close: tasks, owners, due dates, comments, files, notifications, and a clean mobile-friendly list.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "font-semibold")}>
                Start free <ArrowRight />
              </Link>
              <Link href="/use-cases" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "font-semibold")}>
                See use cases
              </Link>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-5 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">The Tuduvia flow</p>
            <div className="mt-5 grid gap-3">
              {simpleFlows.map((flow, index) => (
                <div key={flow} className="flex items-start gap-3 rounded-lg bg-surface p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">{index + 1}</span>
                  <p className="text-sm leading-6 text-muted-foreground">{flow}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Core features</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Everything needed for a clear task list.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-surface/75 p-5">
              <Icon className="h-6 w-6 text-brand" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <ShieldCheck className="h-8 w-8 text-success" />
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Built for people who do not want software training.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Tuduvia is intentionally smaller than a project management suite. It is for personal tasks, temporary work, and small teams that need clarity fast.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["No boards to configure", "No required workspace setup", "No credit card to start", "No heavy project vocabulary"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <h2 className="text-center text-3xl font-semibold">Feature questions</h2>
        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-lg border border-border bg-surface p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
