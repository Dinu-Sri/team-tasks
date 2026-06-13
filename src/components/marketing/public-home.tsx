import { ArrowRight, Bell, CheckCircle2, ClipboardList, MessageCircle, Paperclip, ShieldCheck, Smartphone, Sparkles, Undo2, UserRound, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { highPriorityUseCases } from "@/lib/marketing/use-cases";
import { cn } from "@/lib/utils";

const pains = [
  "Tasks vanish inside chat, notes, and memory.",
  "Boards look powerful, then nobody updates them.",
  "Non-IT people avoid tools that feel like software training.",
  "Team leaders waste time asking who finished what.",
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
  { question: "Is Tuduvia only for teams?", answer: "No. Tuduvia starts as a simple personal to-do list. Team features appear when you invite people." },
  { question: "Why no boards?", answer: "Many people do not need columns, rituals, and setup. They need a clear task, a clear owner, and a clear finish." },
  { question: "Is Tuduvia free?", answer: "Yes. Tuduvia is free to use now while we grow the user base. Paid or credit-based plans may come later for advanced usage." },
  { question: "Can non-technical people use it?", answer: "That is the point. Tuduvia is designed for people who want simple tasks, not software training." },
];

export function PublicHome() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="border-b border-border bg-surface/55">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 text-center sm:px-6 sm:py-20">
          <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={86} height={86} className="h-20 w-20 rounded-2xl object-contain shadow-soft" priority />
          <Badge className="mt-6">No Boards. No Training.</Badge>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl">
            Tuduvia is the simple way from to-do to done.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-xl">
            A damn simple to-do list for personal life, temporary projects, and small teams. Start alone, invite people when needed, and finish work without learning a system.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "px-7")}>
              Start free <ArrowRight />
            </Link>
            <Link href="/use-cases/simple-personal-todo-list" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "px-7")}>
              See personal workflow
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Free while we grow Tuduvia with people and teams who love simple things.</p>
          <ProductPreview />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">The pain</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Most task apps become the new task.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Tuduvia is built for the moment when you do not want a methodology. You just want the work visible enough to finish.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((pain) => (
            <div key={pain} className="rounded-lg border border-border bg-surface/75 p-5">
              <Sparkles className="h-5 w-5 text-warning" />
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{pain}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">The Tuduvia flow</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">From personal list to temporary team in three moves.</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                One person can start with a private task. If it turns into school, home, business, neighbor, friend, or volunteer work, invite the people involved.
              </p>
            </div>
            <div className="grid gap-3">
              {workflow.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-lg border border-border bg-background p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground">{index + 1}</div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Who it is for</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Simple enough for personal life. Strong enough for real coordination.</h2>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <div key={persona.title} className="rounded-lg border border-border bg-surface/75 p-5">
              <h3 className="font-semibold">{persona.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{persona.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Features</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Everything points toward one result: done.</h2>
            </div>
            <Link href="/pricing" className={cn(buttonVariants({ variant: "secondary" }))}>View free plan</Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border bg-background p-5">
                <Icon className="h-5 w-5 text-brand" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Use cases</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Start from the page that sounds like your life.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Each guide turns a real situation into a simple Tuduvia workflow, from one-person tasks to temporary teams.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {highPriorityUseCases.map((useCase) => (
              <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`} className="rounded-lg border border-border bg-surface/75 p-5 transition-colors hover:border-brand/60 hover:bg-surface">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{useCase.audience}</p>
                <h3 className="mt-2 font-semibold">{useCase.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{useCase.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-background p-6">
            <ShieldCheck className="h-6 w-6 text-brand" />
            <h2 className="mt-4 text-2xl font-semibold">Free first, honest later.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Tuduvia is free to use now because adoption matters first. Later, paid or credit-based plans may support higher usage and advanced capabilities. The promise today is clear: start free and keep the workflow simple.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-6">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <h2 className="mt-4 text-2xl font-semibold">No fake proof.</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Tuduvia will earn real testimonials, usage numbers, and customer stories over time. Until then, the website focuses on the product, the workflow, and the specific problems it solves.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Simple answers before you start.</h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-border bg-surface/75 p-5">
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="text-2xl font-semibold">Make the next task visible.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Start with one task. Invite people only when the work becomes shared.</p>
          <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "mt-6 px-7")}>
            Start free <ArrowRight />
          </Link>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}

function ProductPreview() {
  const tasks = [
    { title: "Pay electricity bill", owner: "You", tag: "Personal", done: false },
    { title: "Finish school presentation slides", owner: "Maya", tag: "School", done: false },
    { title: "Call supplier about delivery", owner: "Sam", tag: "Shop", done: true },
  ];

  return (
    <div className="mt-12 w-full max-w-3xl rounded-lg border border-border bg-background p-3 text-left shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div>
          <p className="text-sm font-semibold">Today in Tuduvia</p>
          <p className="text-xs text-muted-foreground">Personal tasks and temporary teams in one simple list.</p>
        </div>
        <Badge variant="success">3 open</Badge>
      </div>
      <div className="grid gap-2 p-3">
        {tasks.map((task) => (
          <div key={task.title} className="flex items-center gap-3 rounded-lg border border-border bg-surface/70 p-3">
            <span className={cn("flex h-7 w-7 items-center justify-center rounded-full border", task.done ? "border-success bg-success text-white" : "border-border bg-background text-muted-foreground")}>
              {task.done ? <CheckCircle2 className="h-4 w-4" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", task.done ? "text-muted-foreground line-through" : "text-foreground")}>{task.title}</p>
              <p className="text-xs text-muted-foreground">Owner: {task.owner}</p>
            </div>
            <Badge variant="secondary">{task.tag}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
