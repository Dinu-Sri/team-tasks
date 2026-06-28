import { LiveDemo } from "@/components/demo/live-demo";
import { pageMetadata } from "@/lib/seo/schema";

export const metadata = pageMetadata({
  title: "Live Demo - Tuduvia",
  description: "Try a safe Tuduvia demo with sample workspaces, tasks, teams, settings, and media before creating an account.",
  path: "/demo",
});

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-background">
      <LiveDemo />
    </main>
  );
}
