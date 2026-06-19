import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/marketing/site";
import { breadcrumbSchema, pageMetadata, webPageSchema } from "@/lib/seo/schema";

const pageTitle = "Tuduvia Cookie Policy";
const pageDescription = "Tuduvia cookie policy and local storage overview for sessions, preferences, security, reliability, and browser controls.";

export const metadata: Metadata = pageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <JsonLd
        data={[
          webPageSchema({ path: "/cookies", name: pageTitle, description: pageDescription }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Cookie Policy", path: "/cookies" },
          ]),
        ]}
      />
      <LegalPage
        title="Cookie Policy"
        description="This page explains how Tuduvia uses cookies and local storage for essential app behavior. It should be updated if analytics or marketing cookies are added later."
        updated="June 13, 2026"
        sections={[
          { title: "Essential cookies", body: ["Tuduvia uses an essential session cookie so users can stay signed in securely. This cookie is required for the app to work."] },
          { title: "Local storage", body: ["Tuduvia may use local storage for preferences such as theme choice and onboarding state. These preferences help the app feel consistent between visits."] },
          { title: "Security and reliability", body: ["Tuduvia may use technical tools and logs to protect the service, detect errors, and keep the app reliable."] },
          { title: "Analytics and marketing cookies", body: ["Tuduvia does not need non-essential marketing cookies for the core task app. If analytics or marketing cookies are added later, this policy and any required consent experience should be updated before use."] },
          { title: "Managing cookies", body: ["You can manage or delete cookies through your browser settings. Blocking essential cookies may prevent sign-in and core Tuduvia features from working."] },
          { title: "Contact", body: [`For cookie or privacy questions, contact ${siteConfig.privacyEmail}.`] },
        ]}
      />
    </>
  );
}
