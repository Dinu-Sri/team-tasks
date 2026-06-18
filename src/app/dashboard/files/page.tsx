import { Download, Files, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type FileMembership = {
  teamId: string;
  role: "OWNER" | "MEMBER";
  team: {
    id: string;
    name: string;
    featureSettings: { attachmentsEnabled: boolean; attachmentLimitMb: number } | null;
  };
};

type DashboardFile = {
  id: string;
  originalName: string;
  size: number;
  uploader: { name: string };
  task: { title: string; team: { name: string } };
};

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function FilesPage() {
  const user = await requireUser();
  const allMemberships = await db.membership.findMany({
    where: { userId: user.id },
    include: { team: { include: { featureSettings: true } } },
    orderBy: { createdAt: "asc" },
  }) as FileMembership[];
  const memberships = allMemberships.filter(({ team }) => team.featureSettings?.attachmentsEnabled);
  const canChangeSettings = allMemberships.some(({ role }) => role === "OWNER");

  const attachments = memberships.length ? (await db.taskAttachment.findMany({
    where: { task: { teamId: { in: memberships.map(({ teamId }) => teamId) } } },
    include: { uploader: { select: { name: true } }, task: { include: { team: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })) as DashboardFile[] : [];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 min-[520px]:flex-row min-[520px]:items-end min-[520px]:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold"><Files className="h-5 w-5 text-brand" />Files</h1>
          <p className="mt-1 text-sm text-muted-foreground">Private attachments from enabled teams.</p>
        </div>
        {canChangeSettings ? <Link href="/dashboard/features" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "w-fit")}><SlidersHorizontal /> Team settings</Link> : null}
      </header>
      {memberships.length ? (
        <div className="flex flex-wrap gap-2">
          {memberships.map(({ team }) => <Badge key={team.id} variant="secondary">{team.name} - {team.featureSettings?.attachmentLimitMb ?? 5} MB limit</Badge>)}
        </div>
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
        ) : (
          <div className="px-4 py-20 text-center">
            <Files className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">{memberships.length ? "No files uploaded yet." : "Files are off for your teams."}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">File limits and attachment access are managed in Team Settings.</p>
            {canChangeSettings ? <Link href="/dashboard/features" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>Open settings</Link> : null}
          </div>
        )}
      </section>
    </div>
  );
}
