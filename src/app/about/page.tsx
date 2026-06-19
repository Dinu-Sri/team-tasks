import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Compass, HeartHandshake, Lightbulb, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/marketing/site";
import { breadcrumbSchema, organizationSchema, pageMetadata, webPageSchema } from "@/lib/seo/schema";
import { cn } from "@/lib/utils";

const pageTitle = "About Tuduvia";
const pageDescription = "Learn about Tuduvia, a simple task app from Clossyan Technologies Pvt Ltd for personal to-do lists, temporary projects, and small teams.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/about",
});

const principles = [
  { icon: Lightbulb, title: "Simple first", text: "A person should understand the task list without training, setup rituals, or project management vocabulary." },
  { icon: Compass, title: "Minimum clicks", text: "The best workflow is the one that lets someone add, assign, finish, and move on quickly." },
  { icon: HeartHandshake, title: "Personal to team", text: "Tuduvia starts as a personal list and expands only when the work needs other people." },
  { icon: ShieldCheck, title: "Practical trust", text: "Clear legal pages, support contact paths, and focused account controls matter as much as the task UI." },
];

const audiences = ["Personal users", "Students", "Families", "Small businesses", "Non-IT teams", "Temporary teams", "Freelancers", "Community groups"];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          webPageSchema({ path: "/about", name: pageTitle, description: pageDescription }),
          organizationSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <MarketingHeader />
      <section className="border-b border-border/60 bg-surface/50">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">About Tuduvia</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">A simple task app for the work people actually need to finish.</h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-xl">
              Tuduvia is operated by {siteConfig.company}. It is built for personal to-do lists, temporary projects, and small teams that want clear tasks without boards or training.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg" }), "font-semibold")}>
                Start free <ArrowRight />
              </Link>
              <Link href="/contact" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "font-semibold")}>
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Why it exists</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Most task tools become too much before the first task is done.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Tuduvia keeps the center of the product small: write the task, add an owner when needed, keep the context nearby, and mark it done.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-lg border border-border bg-surface/75 p-5">
                <Icon className="h-6 w-6 text-brand" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-3xl font-semibold leading-tight">Who Tuduvia is for</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Tuduvia is not trying to be a heavy enterprise project suite. It is for everyday work that needs to stop disappearing.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {audiences.map((audience) => (
              <div key={audience} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-success" />
                {audience}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2 className="text-3xl font-semibold leading-tight">Need help or want to talk?</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          Product support, business questions, privacy requests, and security reports can all start through the Tuduvia contact page.
        </p>
        <Link href="/contact" className={cn(buttonVariants({ size: "lg" }), "mt-8 font-semibold")}>
          Contact Tuduvia <ArrowRight />
        </Link>
      </section>
      <MarketingFooter />
    </main>
  );
}
