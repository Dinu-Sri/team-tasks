import { LiveDemo } from "@/components/demo/live-demo";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { pageMetadata } from "@/lib/seo/schema";

export const metadata = pageMetadata({
  title: "Live Demo - Tuduvia",
  description: "Try a safe Tuduvia demo with sample workspaces, tasks, teams, settings, and media before creating an account.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingHeader />
      <LiveDemo />
      <MarketingFooter />
    </main>
  );
}
