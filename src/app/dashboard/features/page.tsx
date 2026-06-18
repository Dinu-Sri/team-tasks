import { LockKeyhole, SlidersHorizontal } from "lucide-react";

import { FeatureSettingsForm } from "@/components/dashboard/feature-settings-form";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

type TeamSettings = {
  commentsEnabled: boolean;
  attachmentsEnabled: boolean;
  memberTaskViewEnabled: boolean;
  finishedTaskViewEnabled: boolean;
  attachmentLimitMb: number;
};

type SettingsMembership = {
  role: "OWNER" | "MEMBER";
  team: { id: string; name: string; featureSettings: TeamSettings | null };
};

export default async function FeaturesPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  }) as SettingsMembership[];

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5"><h1 className="flex items-center gap-2 text-2xl font-semibold"><SlidersHorizontal className="h-5 w-5 text-brand" />Team Settings</h1><p className="mt-1 text-sm text-muted-foreground">Keep teams simple by default. Turn on extra tools only when the work needs them.</p></header>
      <div className="space-y-3">
        {memberships.map(({ team, role }) => {
          const settings: TeamSettings = team.featureSettings ?? { commentsEnabled: false, attachmentsEnabled: false, memberTaskViewEnabled: false, finishedTaskViewEnabled: false, attachmentLimitMb: 5 };
          const activeCount = [settings.commentsEnabled, settings.attachmentsEnabled, settings.memberTaskViewEnabled, settings.finishedTaskViewEnabled].filter(Boolean).length;
          return (
            <section key={team.id} className="rounded-lg border border-border bg-surface">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold">{team.name}</h2>
                  <p className="text-xs text-muted-foreground">{activeCount ? `${activeCount} optional tool${activeCount === 1 ? "" : "s"} on` : "Simple task list mode"}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={settings.commentsEnabled ? "default" : "secondary"}>Discussion {settings.commentsEnabled ? "on" : "off"}</Badge>
                  <Badge variant={settings.attachmentsEnabled ? "default" : "secondary"}>Files {settings.attachmentsEnabled ? `${settings.attachmentLimitMb} MB` : "off"}</Badge>
                  <Badge variant={settings.memberTaskViewEnabled || settings.finishedTaskViewEnabled ? "default" : "secondary"}>Owner review {settings.memberTaskViewEnabled || settings.finishedTaskViewEnabled ? "on" : "off"}</Badge>
                  <Badge variant={role === "OWNER" ? "default" : "secondary"}>{role.toLowerCase()}</Badge>
                </div>
              </div>
              <div className="p-4">
                {role === "OWNER" ? <FeatureSettingsForm teamId={team.id} {...settings} /> : <div className="flex gap-3 text-sm text-muted-foreground"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" /><p>The team owner manages these settings. You can still use any tools that are already on for this team.</p></div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
