import { Download, ExternalLink, Files, HardDrive } from "lucide-react";
import Link from "next/link";

import { StorageFilters } from "@/components/dashboard/storage-filters";
import { StorageDeleteButton } from "@/components/dashboard/storage-delete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getActiveMembershipAccess } from "@/lib/workspace-access";

type SortKey = "newest" | "oldest" | "largest" | "smallest" | "name";

function sizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString()} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function dateInput(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function endDateInput(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function StoragePage({ searchParams }: { searchParams: Promise<{ q?: string; team?: string; uploader?: string; from?: string; to?: string; sort?: SortKey }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const access = await getActiveMembershipAccess(user.id);
  const visibleTeamIds = access.visibleMemberships.map((membership) => membership.teamId);
  const roleByTeam = new Map(access.visibleMemberships.map((membership) => [membership.teamId, membership.role]));
  const selectedTeamId = query.team && visibleTeamIds.includes(query.team) ? query.team : "";
  const sort: SortKey = ["newest", "oldest", "largest", "smallest", "name"].includes(query.sort ?? "") ? query.sort as SortKey : "newest";
  const q = (query.q ?? "").trim();
  const from = dateInput(query.from);
  const to = endDateInput(query.to);

  const [teams, uploaders] = visibleTeamIds.length ? await Promise.all([
    db.team.findMany({
      where: { id: { in: visibleTeamIds } },
      select: { id: true, name: true, organizationName: true },
      orderBy: { createdAt: "asc" },
    }),
    db.user.findMany({
      where: { uploadedAttachments: { some: { task: { teamId: { in: visibleTeamIds } } } } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]) : [[], []];

  const selectedUploaderId = query.uploader && uploaders.some((uploader) => uploader.id === query.uploader) ? query.uploader : "";
  const orderBy = sort === "oldest"
    ? { createdAt: "asc" as const }
    : sort === "largest"
      ? { size: "desc" as const }
      : sort === "smallest"
        ? { size: "asc" as const }
        : sort === "name"
          ? { originalName: "asc" as const }
          : { createdAt: "desc" as const };

  const attachments = visibleTeamIds.length ? await db.taskAttachment.findMany({
    where: {
      task: { teamId: { in: selectedTeamId ? [selectedTeamId] : visibleTeamIds } },
      ...(selectedUploaderId ? { uploaderId: selectedUploaderId } : {}),
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      ...(q ? {
        OR: [
          { originalName: { contains: q, mode: "insensitive" } },
          { mimeType: { contains: q, mode: "insensitive" } },
          { task: { title: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: {
      uploader: { select: { id: true, name: true, email: true } },
      task: {
        select: {
          id: true,
          title: true,
          teamId: true,
          team: { select: { name: true, organizationName: true } },
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy,
    take: 500,
  }) : [];

  const totalBytes = attachments.reduce((sum, file) => sum + file.size, 0);
  const ownFiles = attachments.filter((file) => file.uploader.id === user.id).length;
  const canDeleteCount = attachments.filter((file) => file.uploader.id === user.id || roleByTeam.get(file.task.teamId) === "OWNER").length;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <HardDrive className="h-6 w-6 text-brand" />
            Storage
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Find, sort, download, and clean up files linked to your visible teams.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{attachments.length.toLocaleString()} files</Badge>
          <Badge variant="secondary">{sizeLabel(totalBytes)}</Badge>
          <Badge variant="secondary">{ownFiles.toLocaleString()} uploaded by you</Badge>
        </div>
      </header>

      <StorageFilters
        teams={teams.map((team) => ({ id: team.id, name: team.organizationName ?? team.name }))}
        uploaders={uploaders.map((uploader) => ({ id: uploader.id, name: uploader.name }))}
        values={{
          q,
          team: selectedTeamId,
          uploader: selectedUploaderId,
          from: query.from ?? "",
          to: query.to ?? "",
          sort,
        }}
      />

      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{canDeleteCount.toLocaleString()} file(s) can be deleted by you.</span>
          <span>Files stay linked to their task until deleted.</span>
        </div>
        {attachments.length ? (
          <div className="divide-y divide-border">
            {attachments.map((file) => {
              const teamName = file.task.team.organizationName ?? file.task.team.name;
              const taskHref = `/?workspace=${encodeURIComponent(file.task.teamId)}&task=${encodeURIComponent(file.task.id)}`;
              const canDelete = file.uploader.id === user.id || roleByTeam.get(file.task.teamId) === "OWNER";
              return (
                <article key={file.id} className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                      <Files className="h-4 w-4 text-brand" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{file.originalName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {teamName} - {file.uploader.name} - {sizeLabel(file.size)} - {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(file.createdAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <Link href={taskHref} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                          {file.task.title}
                        </Link>
                        <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                          Discussion: {file.task._count.comments} comment{file.task._count.comments === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }))} aria-label={`Download ${file.originalName}`} title={`Download ${file.originalName}`}>
                      <Download className="h-4 w-4" />
                    </a>
                    {canDelete ? <StorageDeleteButton attachmentId={file.id} name={file.originalName} /> : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-20 text-center">
            <HardDrive className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No files match this view.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Try another team, uploader, date range, or search term.</p>
          </div>
        )}
      </section>
    </div>
  );
}
