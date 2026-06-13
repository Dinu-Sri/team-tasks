import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Tuduvia terms of use from Clossyan Technologies Pvt Ltd.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      description="These terms describe the basic rules for using Tuduvia. They are a practical starting point and should be reviewed by legal counsel before final publication."
      updated="June 13, 2026"
      sections={[
        { title: "Agreement", body: [`By using Tuduvia, you agree to these Terms of Use with ${siteConfig.company}. If you do not agree, do not use the service.`] },
        { title: "Accounts", body: ["You are responsible for keeping your account credentials secure and for activity that happens under your account.", "You must provide accurate information and use Tuduvia only in ways that comply with applicable law."] },
        { title: "Acceptable use", body: ["Do not use Tuduvia for illegal activity, abuse, harassment, spam, malware, infringement, attempts to bypass security, or activity that harms other users or the service.", "We may suspend or remove accounts that abuse the service, create risk, or violate these terms."] },
        { title: "Your content", body: ["You keep ownership of the tasks, comments, files, and other content you add to Tuduvia.", "You grant Tuduvia the limited permission needed to host, process, display, transmit, and back up that content so the service can work for you and your teams."] },
        { title: "Free plan and future plans", body: ["Tuduvia is free to use now while the product grows. Paid or credit-based plans may be introduced later for higher usage, advanced capabilities, or larger teams.", "Future plan changes will be communicated through the product or website when they become active."] },
        { title: "Service availability", body: ["We work to keep Tuduvia reliable, but the service may change, pause, or experience downtime. Tuduvia is provided without a guarantee that it will be uninterrupted or error-free."] },
        { title: "Disclaimers and liability", body: ["Tuduvia is provided as a productivity tool. To the maximum extent allowed by law, we disclaim warranties and limit liability for indirect, incidental, special, consequential, or punitive damages.", "Do not use Tuduvia as the only system for emergency, safety-critical, or legally regulated obligations unless you have reviewed and approved that use independently."] },
        { title: "Contact", body: [`For questions about these terms, contact ${siteConfig.legalEmail}. Governing law and company address details should be confirmed before final publication.`] },
      ]}
    />
  );
}
