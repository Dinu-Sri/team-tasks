import type { Metadata } from "next";
import { Bug, Handshake, LifeBuoy, LockKeyhole } from "lucide-react";
import Link from "next/link";

import { ContactForm } from "@/components/marketing/contact-form";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/marketing/site";
import { breadcrumbSchema, contactPageSchema, organizationSchema, pageMetadata } from "@/lib/seo/schema";

const pageTitle = "Contact Tuduvia";
const pageDescription = "Contact Tuduvia for product support, business questions, legal and privacy requests, security reports, and feedback.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/contact",
});

const contactPaths = [
  { icon: LifeBuoy, title: "Product support", text: "Questions about accounts, tasks, invites, or using Tuduvia with your team." },
  { icon: Handshake, title: "Business and partnerships", text: "Talk to us about using Tuduvia with a small business, community, or partner audience." },
  { icon: LockKeyhole, title: "Legal and privacy", text: `Reach ${siteConfig.company} for privacy, data, and legal requests.` },
  { icon: Bug, title: "Bug or security report", text: "Tell us when something is broken, risky, or behaving in a way that needs attention." },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <JsonLd
        data={[
          contactPageSchema({ path: "/contact", name: pageTitle, description: pageDescription }),
          organizationSchema(),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <MarketingHeader />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Talk to Tuduvia.</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Questions, setup help, partnership ideas, product feedback, or legal/privacy requests for {siteConfig.company} can start here.
          </p>
          <div className="mt-8 grid gap-3">
            {contactPaths.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-border bg-surface/75 p-5">
                <Icon className="h-5 w-5 text-brand" />
                <h2 className="mt-3 font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Prefer email? Write to <Link href={`mailto:${siteConfig.supportEmail}`} className="font-semibold text-foreground hover:text-brand">{siteConfig.supportEmail}</Link>.
          </p>
        </div>
        <div>
          <ContactForm />
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
