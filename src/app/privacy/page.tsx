import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/marketing/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Tuduvia privacy policy from Clossyan Technologies Pvt Ltd.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains what Tuduvia collects, why we collect it, and how we use it to operate a simple task app. Review this page with legal counsel before relying on it as final legal advice."
      updated="June 13, 2026"
      sections={[
        { title: "Who operates Tuduvia", body: [`Tuduvia is operated by ${siteConfig.company}. Tuduvia provides simple task management for personal users, temporary projects, and small teams.`] },
        { title: "Information we collect", body: ["We collect account details such as name, email address, password hash, session information, and invite information.", "We store the content you create in the app, including tasks, team names, assignments, due dates, comments, attachments, notifications, onboarding progress, and related activity needed to run the service."] },
        { title: "How we use information", body: ["We use information to authenticate users, create tasks and teams, deliver collaboration features, show notifications, process invitations, provide support, improve reliability, and protect the service from abuse.", "We may use technical logs and error-monitoring information to detect and fix production issues."] },
        { title: "Service providers", body: ["Tuduvia may rely on infrastructure, database, email, storage, security, and error-monitoring providers to operate the service. These providers process information only as needed to provide their services to Tuduvia.", "Specific provider details should be reviewed and updated before final publication as the deployment stack evolves."] },
        { title: "Cookies and local storage", body: ["Tuduvia uses essential cookies and local storage for sessions, theme preferences, onboarding state, and core app behavior. See the Cookie Policy for more detail."] },
        { title: "Retention and deletion", body: ["We keep account and workspace information while your account is active or as needed to operate the service, comply with law, resolve disputes, and protect the service.", `You can request deletion or privacy help by contacting ${siteConfig.privacyEmail}.`] },
        { title: "Children and sensitive use", body: ["Tuduvia is a general productivity tool and is not designed for children or for storing highly sensitive regulated records unless your organization has independently reviewed and approved that use."] },
        { title: "Contact", body: [`For privacy questions, contact ${siteConfig.privacyEmail}. For legal requests, contact ${siteConfig.legalEmail}.`] },
      ]}
    />
  );
}
