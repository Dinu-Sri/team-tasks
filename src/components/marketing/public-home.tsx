import { ArrowRight, Ban, Bell, CheckCircle2, Circle, ClipboardList, CreditCard, MessageCircle, MessageCircleMore, Paperclip, ShieldCheck, Smartphone, Undo2, UserRound, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AuthModalButton } from "@/components/auth/auth-modal";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { highPriorityUseCases } from "@/lib/marketing/use-cases";
import { faqSchema, organizationSchema, softwareApplicationSchema, websiteSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pains = [
  { icon: MessageCircle, text: "Tasks vanish inside chat, notes, and memory." },
  { icon: ClipboardList, text: "Boards look powerful, then nobody updates them." },
  { icon: Ban, text: "Non-IT people avoid tools that feel like software training." },
  { icon: UserRound, text: "Team leaders waste time asking who finished what." },
];

const workflow = [
  { title: "Write the task", text: "Capture the thing that must happen without building a project first." },
  { title: "Add the owner", text: "Keep it personal, or invite people when the task becomes shared." },
  { title: "Finish and move on", text: "Complete tasks from a simple list, with undo when a tap happens too fast." },
];

const features = [
  { icon: UserRound, title: "Personal first", text: "Use Tuduvia as your own simple to-do list before you invite anyone." },
  { icon: Users, title: "Temporary teams", text: "School, home, friends, neighbors, business, or events can become short-lived teams." },
  { icon: ClipboardList, title: "Clear ownership", text: "Assign tasks so every person knows exactly what belongs to them." },
  { icon: Bell, title: "Notifications", text: "Keep task changes, invites, due work, and comments visible." },
  { icon: MessageCircle, title: "Comments", text: "Keep decisions and small updates beside the task instead of buried in chat." },
  { icon: Paperclip, title: "Files", text: "Attach useful context when a task needs a document, screenshot, or reference." },
  { icon: Undo2, title: "Undo mistakes", text: "Accidentally completed a task? Bring it back before the moment passes." },
  { icon: Smartphone, title: "Mobile friendly", text: "Open, read, assign, and finish work cleanly from a phone." },
];

const personas = [
  { title: "Personal users", text: "For anyone who wants the simplest possible list for daily life." },
  { title: "Students", text: "Turn group assignments into clear parts without confusing classmates." },
  { title: "Families", text: "Keep home tasks, bills, shopping, and repairs from disappearing." },
  { title: "Small businesses", text: "Assign daily work without teaching staff a project management tool." },
  { title: "Non-IT teams", text: "If a person can read a message, they can understand their Tuduvia tasks." },
  { title: "Temporary groups", text: "Create a team for one project, finish the work, and move on." },
];

const faqs = [
  { question: "Is Tuduvia only for teams?", answer: "No. Tuduvia starts as a simple personal to-do list. Team features appear only when you invite people." },
  { question: "Why no boards?", answer: "Most people don't need columns and setup rituals. They need a clear task, a clear owner, and a clear finish." },
  { question: "Is Tuduvia really free?", answer: "Yes. All features are free — personal tasks, team tasks, comments, files, notifications, and mobile access. No hidden fees." },
  { question: "Can non-technical people use it?", answer: "That's the entire point. Tuduvia is built for people who want simple tasks, not software training." },
];

export function PublicHome() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={[organizationSchema(), websiteSchema(), softwareApplicationSchema(), faqSchema(faqs)]} />
      <MarketingHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-border/50 bg-gradient-to-b from-surface/90 to-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="text-center lg:text-left">
            <Badge className="inline-flex px-4 py-1.5 text-sm font-bold" variant="success">Free &mdash; all features included</Badge>
            <h1 className="mx-auto mt-5 max-w-xl text-4xl font-bold leading-tight tracking-tight sm:text-7xl lg:mx-0">
              To-do <span className="text-brand">&rarr;</span> Done
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-xl lg:mx-0">
              One simple list. Start alone, invite people when it becomes a project. <strong className="text-foreground font-bold">No boards. No training.</strong>
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <AuthModalButton mode="signup" className={cn(buttonVariants({ size: "lg" }), "px-8 font-semibold text-base")}>
                Start free <ArrowRight />
                <span className="ml-3 inline-flex items-center gap-1.5 border-l border-brand-foreground/25 pl-3 text-xs font-normal opacity-90">
                  <CreditCard className="h-3.5 w-3.5" />
                  No credit card needed
                </span>
              </AuthModalButton>
              <Link href="/demo" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "px-8 font-semibold text-base")}>
                Check live demo free
              </Link>
            </div>
          </div>
          <AnimatedProductPreview />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand/50 via-brand/20 to-transparent" />
      </section>

      {/* ── Pain ── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-warning">The problem</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Most task apps become the task.</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex flex-col items-center rounded-xl border border-border/80 bg-surface/80 p-6 text-center transition-colors hover:border-warning/30 hover:bg-surface">
              <Icon className="h-8 w-8 text-warning/80" />
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Flow ── */}
      <section className="border-y border-border/50 bg-surface/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">How it works</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">From personal to-do to team project in three moves.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {workflow.map((step, index) => (
              <div key={step.title} className="flex flex-col items-center rounded-lg border border-border/80 bg-background p-6 text-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">{index + 1}</div>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Personas ── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Who it is for</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Simple enough for anyone. Useful enough for real work.</h2>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <div key={persona.title} className="rounded-lg border border-border/80 bg-surface/80 p-5 transition-colors hover:border-brand/30 hover:bg-surface">
              <h3 className="font-semibold">{persona.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{persona.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-y border-border/50 bg-surface/60">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Features</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Everything points to done.</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/demo" className={cn(buttonVariants({ variant: "secondary" }))}>Live demo &rarr;</Link>
              <Link href="/pricing" className={cn(buttonVariants({ variant: "secondary" }))}>Free plan &rarr;</Link>
            </div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-3 rounded-lg border border-border/80 bg-background p-5 transition-colors hover:border-brand/30 hover:bg-surface">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use cases ── */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Use cases</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Start from the page that sounds like your life.</h2>
          </div>
          <Link href="/use-cases" className={cn(buttonVariants({ variant: "secondary" }))}>All 20 workflows</Link>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {highPriorityUseCases.map((useCase) => (
            <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className="rounded-lg border border-border/80 bg-surface/80 p-5 transition-colors hover:border-brand/40 hover:bg-surface">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{useCase.audience}</p>
              <h3 className="mt-2 font-semibold leading-snug">{useCase.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Trust ── */}
      <section className="border-y border-border/50 bg-surface/60">
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-3">
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold">All features free.</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Personal tasks, team tasks, comments, files, and notifications — all included.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h3 className="text-sm font-semibold">No fake proof.</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">We earn trust through the product, not invented testimonials.</p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border border-border/80 bg-background p-5">
            <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <h3 className="text-sm font-semibold">Works on your phone.</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Open, read, assign, finish. Clean on mobile browsers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">FAQ</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Simple answers.</h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-border/80 bg-surface/80 p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
        {/* ── bottom CTA ── */}
        <div className="mt-12 rounded-xl border-2 border-brand/30 bg-surface p-8 text-center shadow-soft">
          <h2 className="text-2xl font-bold">Make the next task visible.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Start with one task. Invite people only when the work becomes shared.</p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "px-8 font-semibold text-base")}>
              Start free <ArrowRight />
              <span className="ml-3 inline-flex items-center gap-1.5 border-l border-brand-foreground/25 pl-3 text-xs font-normal opacity-90">
                <CreditCard className="h-3.5 w-3.5" />
                No credit card needed
              </span>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}

function AnimatedProductPreview() {
  return (
    <div className="relative mx-auto mt-10 w-full max-w-md rounded-xl border border-border/70 bg-background text-left shadow-soft lg:mt-2">
      {/* Static header — always visible */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 pb-3 pt-4">
        <div>
          <p className="text-sm font-semibold">Today in Tuduvia</p>
          <p className="animate-subtitle text-xs text-muted-foreground">Team tasks, clear ownership.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-success/20 bg-success/12 px-2.5 py-1 text-xs font-medium text-success">3 open</span>
      </div>

      <style>{`
        @keyframes tuduvia-fade-swap {
          0%,  44%  { opacity: 1; }
          46%, 48%  { opacity: 0; }
          50%,  94% { opacity: 0; }
          96%, 98%  { opacity: 1; }
          100%      { opacity: 1; }
        }
        .animate-scene-a { animation: tuduvia-fade-swap 8s ease-in-out infinite; }
        .animate-scene-b { animation: tuduvia-fade-swap 8s ease-in-out infinite; animation-delay: -4s; }

        .animate-subtitle::after {
          animation: subtitle-cycle 8s ease-in-out infinite;
          content: "";
        }
        @keyframes subtitle-cycle {
          0%,  44%  { content: "Team tasks, clear ownership."; }
          46%, 48%  { opacity: 0; }
          50%,  94% { content: "Home tasks, done or next."; opacity: 1; }
          96%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Task area — scenes swap with simple opacity fade */}
      <div className="relative px-4 py-3" style={{ minHeight: "176px" }}>

        {/* ── Scene A: Team tasks (matching screenshot) ── */}
        <div className="animate-scene-a grid gap-1.5" style={{ position: "absolute", left: "16px", right: "16px", top: "12px" }}>
          {[
            { title: "Assign onboarding buddy", owner: "Liam", tag: "HR", comments: 1, files: 1 },
            { title: "Review Q3 report draft",  owner: "Priya", tag: "Team", comments: 0, files: 0 },
            { title: "Book venue for offsite",   owner: "Carlos", tag: "Events", comments: 2, files: 0 },
          ].map((task, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-success bg-success text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.owner}</p>
              </div>
              {task.comments > 0 ? (
                <span className="relative flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  <span>{task.comments}</span>
                  {task.comments > 0 ? (
                    <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-danger px-1 text-[8px] font-semibold text-white">{task.comments}</span>
                  ) : null}
                </span>
              ) : null}
              {task.files > 0 ? (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>{task.files}</span>
                </span>
              ) : null}
              <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 shrink-0">{task.tag}</Badge>
            </div>
          ))}
        </div>

        {/* ── Scene B: Home tasks (2 done, 1 open) ── */}
        <div className="animate-scene-b grid gap-1.5" style={{ position: "absolute", left: "16px", right: "16px", top: "12px" }}>
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2.5 opacity-55">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-success bg-success text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium line-through text-muted-foreground">Pay electricity bill</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>
            <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 shrink-0">Home</Badge>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2.5 opacity-55">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-success bg-success text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium line-through text-muted-foreground">Buy groceries for week</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>
            <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 shrink-0">Home</Badge>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/70 px-3 py-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
              <Circle className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">Call landlord about leak</p>
              <p className="text-xs text-muted-foreground">You</p>
            </div>
            <Badge variant="secondary" className="text-[0.65rem] px-2 py-0.5 shrink-0">Home</Badge>
          </div>
        </div>

      </div>
    </div>
  );
}
