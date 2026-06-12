import { Download, Files } from "lucide-react";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FileSettingsForm } from "@/components/dashboard/file-settings-form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const user = await requireUser();
  const memberships = await db.membership.findMany({
    where: { userId: user.id, team: { featureSettings: { attachmentsEnabled: true } } },
    include: { team: { include: { featureSettings: true } } },
  });
  if (!memberships.length) redirect("/dashboard/features");

  const attachments = await db.taskAttachment.findMany({
    where: { task: { teamId: { in: memberships.map(({ teamId }) => teamId) } } },
    include: { uploader: { select: { name: true } }, task: { include: { team: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <header className="border-b border-border pb-5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold"><Files className="h-5 w-5 text-brand" />Files</h1>
        <p className="mt-1 text-sm text-muted-foreground">Private attachments from enabled teams.</p>
      </header>
      <div className="flex flex-wrap gap-2">
        {memberships.map(({ team }) => <Badge key={team.id} variant="secondary">{team.name} - {team.featureSettings?.attachmentLimitMb ?? 5} MB limit</Badge>)}
      </div>
      {memberships.some(({ role }) => role === "OWNER") ? (
        <section className="grid gap-3 sm:grid-cols-2">
          {memberships.filter(({ role }) => role === "OWNER").map(({ team }) => (
            <FileSettingsForm key={team.id} teamId={team.id} teamName={team.name} commentsEnabled={team.featureSettings?.commentsEnabled ?? false} initialLimit={team.featureSettings?.attachmentLimitMb ?? 5} />
          ))}
        </section>
      ) : null}
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        {attachments.length ? (
          <div className="divide-y divide-border">
            {attachments.map((file) => (
              <div key={file.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle"><Files className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.originalName}</p><p className="truncate text-xs text-muted-foreground">{file.task.team.name} - {file.task.title} - {file.uploader.name} - {sizeLabel(file.size)}</p></div>
                <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }))} aria-label={`Download ${file.originalName}`}><Download /></a>
              </div>
            ))}
          </div>
        ) : <p className="px-4 py-20 text-center text-sm text-muted-foreground">No files uploaded yet.</p>}
      </section>
    </div>
  );
}
