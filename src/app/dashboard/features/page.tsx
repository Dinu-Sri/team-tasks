import { LockKeyhole, SlidersHorizontal } from "lucide-react";

import { FeatureSettingsForm } from "@/components/dashboard/feature-settings-form";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function FeaturesPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5"><h1 className="flex items-center gap-2 text-2xl font-semibold"><SlidersHorizontal className="h-5 w-5 text-brand" />Features</h1><p className="mt-1 text-sm text-muted-foreground">Add collaboration only where a team needs it.</p></header>
      <div className="space-y-3">
        {memberships.map(({ team, role }) => {
          const settings = team.featureSettings ?? { commentsEnabled: false, attachmentsEnabled: false, memberTaskViewEnabled: false, attachmentLimitMb: 5 };
          return (
            <section key={team.id} className="rounded-lg border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{team.name}</h2><p className="text-xs text-muted-foreground">Settings apply to this team only.</p></div><Badge variant={role === "OWNER" ? "default" : "secondary"}>{role.toLowerCase()}</Badge></div>
              <div className="p-4">
                {role === "OWNER" ? <FeatureSettingsForm teamId={team.id} {...settings} /> : <div className="flex gap-3 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>The owner manages these features. Comments are {settings.commentsEnabled ? "on" : "off"}; files are {settings.attachmentsEnabled ? `on up to ${settings.attachmentLimitMb} MB` : "off"}; member task view is {settings.memberTaskViewEnabled ? "on" : "off"}.</p></div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
