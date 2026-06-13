import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";

type LegalSection = {
  title: string;
  body: string[];
};

export function LegalPage({ title, description, updated, sections }: { title: string; description: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <article className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Legal</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: {updated}</p>
        <div className="mt-10 grid gap-8">
          {sections.map((section) => (
            <section key={section.title} className="border-t border-border pt-6">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 grid gap-3 text-sm leading-7 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
      <MarketingFooter />
    </main>
  );
}
