import type { Prisma } from "@prisma/client";
import { Download, ExternalLink, Files, HardDrive } from "lucide-react";
import Link from "next/link";

import { DashboardPagination, pageFromParam } from "@/components/dashboard/dashboard-pagination";
import { StorageFilters } from "@/components/dashboard/storage-filters";
import { StorageDeleteButton } from "@/components/dashboard/storage-delete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDashboardWorkspaceContext } from "@/lib/dashboard-workspace";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "largest" | "smallest" | "name";
const STORAGE_PAGE_SIZE = 6;
type StorageAttachment = Prisma.TaskAttachmentGetPayload<{
  include: {
    uploader: { select: { id: true; name: true; email: true } };
    task: {
      select: {
        id: true;
        title: true;
        teamId: true;
        team: { select: { name: true; organizationName: true } };
        _count: { select: { comments: true } };
      };
    };
  };
}>;

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

export default async function StoragePage({ searchParams }: { searchParams: Promise<{ q?: string; workspace?: string; uploader?: string; from?: string; to?: string; sort?: SortKey; page?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const workspace = await getDashboardWorkspaceContext(user.id, query.workspace);
  const roleByTeam = new Map(workspace.visibleMemberships.map((membership) => [membership.teamId, membership.role]));
  const sort: SortKey = ["newest", "oldest", "largest", "smallest", "name"].includes(query.sort ?? "") ? query.sort as SortKey : "newest";
  const page = pageFromParam(query.page);
  const q = (query.q ?? "").trim();
  const from = dateInput(query.from);
  const to = endDateInput(query.to);

  const uploaders = workspace.selectedTeamIds.length ? await db.user.findMany({
    where: { uploadedAttachments: { some: { task: { teamId: { in: workspace.selectedTeamIds } } } } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  }) : [];

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

  const attachmentWhere: Prisma.TaskAttachmentWhereInput = {
    task: { teamId: { in: workspace.selectedTeamIds } },
    ...(selectedUploaderId ? { uploaderId: selectedUploaderId } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(q ? {
      OR: [
        { originalName: { contains: q, mode: "insensitive" } },
        { mimeType: { contains: q, mode: "insensitive" } },
        { task: { title: { contains: q, mode: "insensitive" } } },
      ],
    } : {}),
  };

  const [totalAttachments, attachments]: [number, StorageAttachment[]] = workspace.selectedTeamIds.length ? await Promise.all([
    db.taskAttachment.count({ where: attachmentWhere }),
    db.taskAttachment.findMany({
      where: attachmentWhere,
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
      skip: (page - 1) * STORAGE_PAGE_SIZE,
      take: STORAGE_PAGE_SIZE,
    }),
  ]) as [number, StorageAttachment[]] : [0, []];

  const totalBytes = attachments.reduce((sum, file) => sum + file.size, 0);
  const ownFiles = attachments.filter((file) => file.uploader.id === user.id).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Storage</h1>
          <p className="mt-1 text-sm text-muted-foreground">Files attached to your visible tasks.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Badge variant="secondary">{totalAttachments.toLocaleString()} file{totalAttachments === 1 ? "" : "s"}</Badge>
          <Badge variant="secondary">{sizeLabel(totalBytes)} shown</Badge>
          <Badge variant="secondary">{ownFiles.toLocaleString()} by you</Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <StorageFilters
          uploaders={uploaders.map((uploader) => ({ id: uploader.id, name: uploader.name }))}
          values={{
            q,
            uploader: selectedUploaderId,
            from: query.from ?? "",
            to: query.to ?? "",
            sort,
          }}
        />

      <section className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Files className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Files</h2>
              <p className="text-sm text-muted-foreground">Open the task or download the file.</p>
            </div>
          </div>
          <Badge variant="secondary">{attachments.length} shown</Badge>
        </div>

        {attachments.length ? (
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
            {attachments.map((file) => {
              const teamName = file.task.team.organizationName ?? file.task.team.name;
              const taskHref = `/?workspace=${encodeURIComponent(file.task.teamId)}&task=${encodeURIComponent(file.task.id)}`;
              const canDelete = file.uploader.id === user.id || roleByTeam.get(file.task.teamId) === "OWNER";
              return (
                <article key={file.id} className="flex min-h-44 flex-col justify-between rounded-lg border border-border bg-background p-4">
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-brand">
                        <Files className="h-4 w-4" />
                      </span>
                      <div className="flex items-center gap-1">
                        <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }))} aria-label={`Download ${file.originalName}`} title={`Download ${file.originalName}`}>
                          <Download className="h-4 w-4" />
                        </a>
                        {canDelete ? <StorageDeleteButton attachmentId={file.id} name={file.originalName} /> : null}
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-2 text-sm font-semibold leading-5">{file.originalName}</p>
                    <p className="mt-2 truncate text-xs text-muted-foreground">{teamName} - {file.uploader.name}</p>
                  </div>
                  <div className="mt-4 space-y-3">
                    <Link href={taskHref} className="inline-flex max-w-full items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{file.task.title}</span>
                    </Link>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{sizeLabel(file.size)}</span>
                      <span>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(file.createdAt)}</span>
                    </div>
                    <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {file.task._count.comments} comment{file.task._count.comments === 1 ? "" : "s"}
                    </span>
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
        <DashboardPagination
          basePath="/dashboard/storage"
          searchParams={query}
          page={page}
          total={totalAttachments}
          pageSize={STORAGE_PAGE_SIZE}
        />
      </section>
      </div>
    </div>
  );
}
