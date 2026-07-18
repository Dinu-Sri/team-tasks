"use client";

import { CheckCheck, Download, Eye, FileUp, Files, FileText, FileVideo, ImageIcon, MessageCircleMore, Paperclip, Pencil, Send, Trash2, X } from "lucide-react";
import { DueDateField } from "@/components/tasks/due-date-field";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { addTaskCommentAction, markTaskCommentsReadAction } from "@/app/actions/comments";
import { deleteTaskAction, updateTaskAction } from "@/app/actions/tasks";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const ACCEPTED_ATTACHMENT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.webm,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export type TaskDetail = {
  id: string;
  title: string;
  note: string | null;
  creatorId: string;
  team: {
    id: string;
    name: string;
    commentsEnabled: boolean;
    attachmentsEnabled: boolean;
    attachmentLimitMb: number;
    currentUserRole: "OWNER" | "MEMBER";
    members: Array<{ id: string; name: string; email: string }>;
  };
  comments: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; name: string };
    receipts: Array<{
      id: string;
      userId: string;
      requiresAttention: boolean;
      readAt: string | null;
      user: { id: string; name: string };
    }>;
  }>;
  attachments: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt: string;
    uploader: { id: string; name: string };
  }>;
  unreadCommentCount: number;
  hasMentionAttention: boolean;
};

function sizeLabel(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function TaskDetailPanel({ task, currentUserId, onClose }: { task: TaskDetail; currentUserId: string; onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"comments" | "files">(task.team.commentsEnabled ? "comments" : "files");
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [, startReadTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [onClose]);
  useEffect(() => {
    if (tab !== "comments" || task.unreadCommentCount === 0) return;
    startReadTransition(async () => {
      await markTaskCommentsReadAction(task.id);
      router.refresh();
    });
  }, [router, tab, task.id, task.unreadCommentCount]);

  async function uploadFiles(files: File[] | FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return true;
    setFileError("");
    const oversized = selectedFiles.find((file) => file.size > task.team.attachmentLimitMb * 1024 * 1024);
    if (oversized) { setFileError(`${oversized.name} is larger than this team's ${task.team.attachmentLimitMb} MB limit.`); return false; }
    setUploading(true);
    const failures: string[] = [];
    try {
      for (const file of selectedFiles) {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(`/api/tasks/${task.id}/attachments`, { method: "POST", body });
        const data = await response.json() as { error?: string };
        if (!response.ok) {
          failures.push(`${file.name}: ${data.error || "Upload failed."}`);
          if (response.status === 403) break;
        }
      }
      if (failures.length) {
        const shown = failures.slice(0, 2).join(" ");
        setFileError(failures.length > 2 ? `${shown} ${failures.length - 2} more file(s) failed.` : shown);
      }
      router.refresh();
      return failures.length === 0;
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Upload failed.");
      return false;
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeFile(id: string) {
    if (!window.confirm("Remove this file from the task?")) return;
    const response = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (!response.ok) { const data = await response.json() as { error?: string }; setFileError(data.error || "Could not remove the file."); return; }
    router.refresh();
  }

  if (!mounted) return null;
  const hasBoth = task.team.commentsEnabled && task.team.attachmentsEnabled;
  const canEdit = task.team.currentUserRole === "OWNER" || task.creatorId === currentUserId;
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={task.title} className="flex max-h-[calc(100dvh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-border bg-surface shadow-soft sm:max-h-[84vh] sm:rounded-lg">
        <header className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1"><p className="break-words text-base font-semibold sm:text-lg">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.team.name}</p>{task.note ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{task.note}</p> : null}</div>
          <div className="flex shrink-0 items-center gap-1">
            {canEdit ? <EditTaskButton task={task} /> : null}
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close task"><X className="h-4 w-4" /></button>
          </div>
        </header>

        {hasBoth ? <div className="grid grid-cols-2 border-b border-border p-1.5"><TabButton active={tab === "comments"} onClick={() => setTab("comments")} icon={<MessageCircleMore />} label={`Discussion ${task.comments.length ? `(${task.comments.length})` : ""}`} unread={task.unreadCommentCount} /><TabButton active={tab === "files"} onClick={() => setTab("files")} icon={<Paperclip />} label={`Media ${task.attachments.length ? `(${task.attachments.length})` : ""}`} /></div> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {tab === "comments" && task.team.commentsEnabled ? <Discussion task={task} currentUserId={currentUserId} uploading={uploading} fileError={fileError} onUploadFiles={uploadFiles} /> : null}
          {tab === "files" && task.team.attachmentsEnabled ? (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between"><div><h2 className="text-sm font-semibold">Task media</h2><p className="text-xs text-muted-foreground">Images, videos, and files up to {task.team.attachmentLimitMb} MB each.</p></div><input ref={fileRef} type="file" multiple className="hidden" accept={ACCEPTED_ATTACHMENT_TYPES} onChange={(event) => { void uploadFiles(event.target.files); event.currentTarget.value = ""; }} /><Button type="button" size="sm" className="w-full min-[420px]:w-auto" disabled={uploading} onClick={() => fileRef.current?.click()}><FileUp />{uploading ? "Uploading..." : "Add media"}</Button></div>
              {fileError ? <p className="mb-3 text-sm text-danger">{fileError}</p> : null}
              {task.attachments.length ? <div className="divide-y divide-border rounded-lg border border-border">{task.attachments.map((file) => <MediaListItem key={file.id} file={file} currentUserId={currentUserId} currentUserRole={task.team.currentUserRole} onRemove={removeFile} />)}</div> : <div className="py-16 text-center"><Paperclip className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No media yet.</p></div>}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function EditTaskButton({ task }: { task: TaskDetail }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setPending(true);
    const body = new FormData();
    body.set("taskId", task.id);
    body.set("title", title);
    if (due) body.set("due", due);
    body.set("priority", priority);
    await updateTaskAction(null, body as unknown as Parameters<typeof updateTaskAction>[1]);
    setPending(false);
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"?\n\nThis cannot be undone.`)) return;
    const body = new FormData();
    body.set("taskId", task.id);
    await deleteTaskAction(null, body as unknown as Parameters<typeof deleteTaskAction>[1]);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="fixed left-3 right-3 top-3 z-[140] rounded-lg border border-border bg-surface p-3 shadow-soft sm:static sm:w-80 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-base sm:h-auto sm:rounded sm:px-2 sm:py-1 sm:text-sm" placeholder="Task title" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-1">
            <DueDateField value={due} onChange={setDue} emptyLabel="Keep date" selectClassName="h-10 rounded-lg px-2 text-base sm:h-auto sm:rounded sm:px-1.5 sm:py-0.5 sm:text-xs" />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-10 min-w-0 rounded-lg border border-border bg-surface px-2 text-base sm:h-auto sm:rounded sm:px-1.5 sm:py-0.5 sm:text-xs">
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:flex sm:items-center sm:gap-1">
            <button onClick={handleSave} disabled={pending || !title.trim()} className="h-10 rounded-full bg-brand px-3 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-50 sm:h-auto sm:rounded sm:px-2 sm:py-1 sm:text-xs">{pending ? "..." : "Save"}</button>
            <button onClick={() => setEditing(false)} className="h-10 rounded-full px-3 text-sm text-muted-foreground hover:bg-surface-subtle hover:text-foreground sm:h-auto sm:rounded sm:px-2 sm:py-1 sm:text-xs">Cancel</button>
            <button onClick={handleDelete} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger sm:h-8 sm:w-8" title="Delete task"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      </div>
    );
  }

  return <button type="button" onClick={() => setEditing(true)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" title="Edit task"><Pencil className="h-4 w-4" /></button>;
}

function TabButton({ active, onClick, icon, label, unread = 0 }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; unread?: number }) {
  return <button type="button" onClick={onClick} className={cn("relative flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium", active ? "bg-surface-subtle text-foreground" : "text-muted-foreground hover:text-foreground", "[&_svg]:h-4 [&_svg]:w-4")}>{icon}{label}{unread ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unread}</span> : null}</button>;
}

function Discussion({
  task,
  currentUserId,
  uploading,
  fileError,
  onUploadFiles,
}: {
  task: TaskDetail;
  currentUserId: string;
  uploading: boolean;
  fileError: string;
  onUploadFiles: (files: File[] | FileList | null) => Promise<boolean>;
}) {
  const timeline = [
    ...task.comments.map((comment) => ({ type: "comment" as const, createdAt: comment.createdAt, item: comment })),
    ...task.attachments.map((file) => ({ type: "media" as const, createdAt: file.createdAt, item: file })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="flex min-h-[18rem] flex-col sm:min-h-[22rem]">
      <div className="flex-1 space-y-4 p-4 sm:p-5">
        {timeline.length ? timeline.map((entry) => {
          if (entry.type === "media") return <DiscussionMedia key={`media-${entry.item.id}`} file={entry.item} currentUserId={currentUserId} />;
          const comment = entry.item;
          const own = comment.author.id === currentUserId;
          const attentionReceipts = comment.receipts.filter(({ requiresAttention }) => requiresAttention);
          const relevantReceipts = attentionReceipts.length ? attentionReceipts : comment.receipts;
          const readCount = relevantReceipts.filter(({ readAt }) => readAt).length;
          const allRead = relevantReceipts.length > 0 && readCount === relevantReceipts.length;
          return (
            <article key={comment.id} className={cn("max-w-[88%]", own && "ml-auto")}>
              <div className={cn("rounded-lg px-3 py-2.5", own ? "bg-brand text-brand-foreground" : "bg-surface-subtle")}>
                <p className="whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p>
              </div>
              <div className={cn("mt-1 flex items-center gap-1 px-1 text-xs text-muted-foreground", own && "justify-end text-right")}>
                <span>{comment.author.name} - {formatDateTime(comment.createdAt)}</span>
                {own && relevantReceipts.length ? <span className={cn("flex items-center gap-1", allRead && "text-blue-600 dark:text-blue-300")} title={`${readCount} of ${relevantReceipts.length} read`}><CheckCheck className="h-3.5 w-3.5" />{readCount}/{relevantReceipts.length}</span> : null}
              </div>
            </article>
          );
        }) : <div className="py-14 text-center"><MessageCircleMore className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Ask for clarification here.</p></div>}
      </div>
      <MentionComposer taskId={task.id} members={task.team.members.filter((member) => member.id !== currentUserId)} attachmentsEnabled={task.team.attachmentsEnabled} attachmentLimitMb={task.team.attachmentLimitMb} uploading={uploading} fileError={fileError} onUploadFiles={onUploadFiles} />
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function mediaKind(file: TaskDetail["attachments"][number]) {
  if (file.mimeType.startsWith("image/")) return "image";
  if (file.mimeType.startsWith("video/")) return "video";
  if (file.mimeType === "application/pdf") return "pdf";
  return "file";
}

function MediaIcon({ file }: { file: TaskDetail["attachments"][number] }) {
  const kind = mediaKind(file);
  if (kind === "image") return <ImageIcon className="h-4 w-4 shrink-0 text-brand" />;
  if (kind === "video") return <FileVideo className="h-4 w-4 shrink-0 text-brand" />;
  if (kind === "pdf") return <FileText className="h-4 w-4 shrink-0 text-brand" />;
  return <Files className="h-4 w-4 shrink-0 text-brand" />;
}

function DiscussionMedia({ file, currentUserId }: { file: TaskDetail["attachments"][number]; currentUserId: string }) {
  const own = file.uploader.id === currentUserId;
  const kind = mediaKind(file);
  const canPreview = kind === "image" || kind === "video" || kind === "pdf";
  const [viewerOpen, setViewerOpen] = useState(false);
  return (
    <article className={cn("w-fit max-w-[88%]", own && "ml-auto")}>
      <div className={cn("w-fit max-w-full overflow-hidden rounded-lg border border-border bg-surface-subtle", own && "bg-brand/10")}>
        {kind === "image" ? (
          <button type="button" onClick={() => setViewerOpen(true)} className="block w-fit max-w-full bg-background p-1 text-left" aria-label={`Open ${file.originalName}`}>
            <img src={`/api/attachments/${file.id}?preview=1`} alt={file.originalName} className="max-h-36 max-w-56 rounded-md object-contain" loading="lazy" />
          </button>
        ) : kind === "video" ? (
          <button type="button" onClick={() => setViewerOpen(true)} className="block w-fit max-w-full bg-black p-1 text-left" aria-label={`Open ${file.originalName}`}>
            <video src={`/api/attachments/${file.id}?preview=1`} muted preload="metadata" className="max-h-36 max-w-56 rounded-md object-contain" />
          </button>
        ) : kind === "pdf" ? (
          <button type="button" onClick={() => setViewerOpen(true)} className="flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-subtle">
            <MediaIcon file={file} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{file.originalName}</span>
              <span className="block text-xs text-muted-foreground">{sizeLabel(file.size)}</span>
            </span>
          </button>
        ) : (
          <a href={`/api/attachments/${file.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-subtle">
            <MediaIcon file={file} />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{file.originalName}</span>
              <span className="block text-xs text-muted-foreground">{sizeLabel(file.size)}</span>
            </span>
          </a>
        )}
      </div>
      <div className={cn("mt-1 px-1 text-xs text-muted-foreground", own && "text-right")}>{file.uploader.name} - {formatDateTime(file.createdAt)}</div>
      {canPreview && viewerOpen ? <MediaViewer file={file} onClose={() => setViewerOpen(false)} /> : null}
    </article>
  );
}

function MediaListItem({ file, currentUserId, currentUserRole, onRemove }: { file: TaskDetail["attachments"][number]; currentUserId: string; currentUserRole: TaskDetail["team"]["currentUserRole"]; onRemove: (id: string) => Promise<void> }) {
  const canDelete = file.uploader.id === currentUserId || currentUserRole === "OWNER";
  const image = file.mimeType.startsWith("image/");
  const canPreview = ["image", "video", "pdf"].includes(mediaKind(file));
  const [viewerOpen, setViewerOpen] = useState(false);
  return (
    <div className="flex min-h-14 items-center gap-3 px-3 py-2.5">
      <MediaIcon file={file} />
      {canPreview ? (
        <button type="button" onClick={() => setViewerOpen(true)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{file.originalName}</p>
          <p className="truncate text-xs text-muted-foreground">{sizeLabel(file.size)} - {file.uploader.name} - {formatDateTime(file.createdAt)}</p>
        </button>
      ) : (
        <a href={`/api/attachments/${file.id}`} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{file.originalName}</p>
          <p className="truncate text-xs text-muted-foreground">{sizeLabel(file.size)} - {file.uploader.name} - {formatDateTime(file.createdAt)}</p>
        </a>
      )}
      {image ? <ImagePreview attachmentId={file.id} name={file.originalName} /> : null}
      <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "h-9 w-9")} aria-label={`Download ${file.originalName}`}><Download /></a>
      {canDelete ? <button type="button" onClick={() => void onRemove(file.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${file.originalName}`}><Trash2 className="h-4 w-4" /></button> : null}
      {viewerOpen ? <MediaViewer file={file} onClose={() => setViewerOpen(false)} /> : null}
    </div>
  );
}

function MediaViewer({ file, onClose }: { file: TaskDetail["attachments"][number]; onClose: () => void }) {
  const kind = mediaKind(file);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/80 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={file.originalName} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
        <header className="flex items-center gap-3 border-b border-border px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.originalName}</p>
            <p className="text-xs text-muted-foreground">{sizeLabel(file.size)}</p>
          </div>
          <a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "secondary", size: "icon" }), "h-9 w-9")} aria-label={`Download ${file.originalName}`}>
            <Download />
          </a>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close viewer">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background p-2">
          {kind === "image" ? (
            <img src={`/api/attachments/${file.id}?preview=1`} alt={file.originalName} className="max-h-[78vh] max-w-full object-contain" />
          ) : kind === "video" ? (
            <video src={`/api/attachments/${file.id}?preview=1`} controls autoPlay className="max-h-[78vh] max-w-full bg-black" />
          ) : kind === "pdf" ? (
            <iframe src={`/api/attachments/${file.id}?preview=1`} title={file.originalName} className="h-[78vh] w-full rounded bg-white" />
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function ImagePreview({ attachmentId, name }: { attachmentId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 288 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  function showPreview() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const width = Math.min(288, window.innerWidth - 24);
      const previewHeight = 250;
      const top = rect.top > previewHeight + 12 ? rect.top - previewHeight - 8 : rect.bottom + 8;
      const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
      setPosition({ top, left, width });
    }
    setOpen(true);
  }

  return (
    <div>
      <button ref={buttonRef} type="button" onMouseEnter={showPreview} onMouseLeave={() => setOpen(false)} onFocus={showPreview} onBlur={() => setOpen(false)} onClick={() => open ? setOpen(false) : showPreview()} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Preview ${name}`} aria-expanded={open}>
        <Eye className="h-4 w-4" />
      </button>
      {open ? createPortal(
        <div className="pointer-events-none fixed z-[130] overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-soft" style={position}>
          <img src={`/api/attachments/${attachmentId}?preview=1`} alt={`Preview of ${name}`} className="max-h-52 w-full rounded-md object-contain" loading="lazy" />
          <p className="truncate px-1 pb-0.5 pt-1.5 text-xs text-muted-foreground">{name}</p>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}

type MentionOption = { id: string; name: string; email: string };

function MentionComposer({
  taskId,
  members,
  attachmentsEnabled,
  attachmentLimitMb,
  uploading,
  fileError,
  onUploadFiles,
}: {
  taskId: string;
  members: TaskDetail["team"]["members"];
  attachmentsEnabled: boolean;
  attachmentLimitMb: number;
  uploading: boolean;
  fileError: string;
  onUploadFiles: (files: File[] | FileList | null) => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<MentionOption[]>([]);
  const [draftFiles, setDraftFiles] = useState<Array<{ id: string; file: File; previewUrl: string | null }>>([]);
  const [draftError, setDraftError] = useState("");
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const draftFilesRef = useRef(draftFiles);
  const context = useMemo(() => { const before = text.slice(0, cursor); const at = before.lastIndexOf("@"); if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null; const query = before.slice(at + 1); if (query.includes("\n")) return null; return { at, query }; }, [cursor, text]);
  const suggestions = useMemo(() => {
    if (!context) return [];
    const query = context.query.toLowerCase();
    const all: MentionOption = { id: "__all__", name: "all", email: "Notify everyone in this team" };
    return [all, ...members].filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(query)).slice(0, 6);
  }, [context, members]);
  const validSelected = selected.filter((member) => text.includes(`@${member.name}`));

  useEffect(() => setActiveIndex(0), [context?.query]);
  useEffect(() => { draftFilesRef.current = draftFiles; }, [draftFiles]);
  useEffect(() => () => { draftFilesRef.current.forEach(({ previewUrl }) => { if (previewUrl) URL.revokeObjectURL(previewUrl); }); }, []);

  function choose(member: MentionOption) {
    if (!context) return;
    const replacement = `@${member.name} `;
    const next = text.slice(0, context.at) + replacement + text.slice(cursor);
    const nextCursor = context.at + replacement.length;
    setText(next); setSelected((items) => items.some(({ id }) => id === member.id) ? items : [...items, member]); setCursor(nextCursor);
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(nextCursor, nextCursor); });
  }

  function addDraftFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) return;
    setDraftError("");
    setCommentError("");
    const oversized = selectedFiles.find((file) => file.size > attachmentLimitMb * 1024 * 1024);
    if (oversized) {
      setDraftError(`${oversized.name} is larger than this team's ${attachmentLimitMb} MB limit.`);
      return;
    }
    setDraftFiles((current) => [
      ...current,
      ...selectedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: file.type.startsWith("image/") || file.type.startsWith("video/") ? URL.createObjectURL(file) : null,
      })),
    ]);
  }

  function removeDraftFile(id: string) {
    setDraftFiles((current) => {
      const draft = current.find((item) => item.id === id);
      if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !draftFiles.length) return;
    setPending(true);
    setCommentError("");
    setDraftError("");
    try {
      if (trimmed) {
        const formData = new FormData(event.currentTarget);
        formData.set("body", trimmed);
        const result = await addTaskCommentAction({}, formData);
        if (result.error) {
          setCommentError(result.error);
          return;
        }
        setText("");
        setSelected([]);
      }
      if (draftFiles.length) {
        const uploaded = await onUploadFiles(draftFiles.map(({ file }) => file));
        if (!uploaded) return;
        draftFiles.forEach(({ previewUrl }) => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
        setDraftFiles([]);
      }
      setText("");
      setSelected([]);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
      <input type="hidden" name="taskId" value={taskId} />
      {validSelected
        .filter(({ id }) => id !== "__all__")
        .map((member) => <input key={member.id} type="hidden" name="mentionedUserIds" value={member.id} />)}

      {suggestions.length ? (
        <div id={`mentions-${taskId}`} role="listbox" className="absolute bottom-full left-3 right-3 mb-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-soft sm:left-4 sm:right-auto sm:w-80">
          {suggestions.map((member, index) => (
            <button
              key={member.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(member)}
              className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", index === activeIndex ? "bg-surface-subtle" : "hover:bg-surface-subtle")}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                {member.id === "__all__" ? "ALL" : member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">@{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {draftFiles.length ? (
        <div className="mb-3 flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
          {draftFiles.map((draft) => <DraftAttachment key={draft.id} draft={draft} onRemove={() => removeDraftFile(draft.id)} />)}
        </div>
      ) : null}

      <div className="flex items-end gap-2">
        {attachmentsEnabled ? (
          <>
            <input ref={attachmentInputRef} type="file" multiple className="hidden" accept={ACCEPTED_ATTACHMENT_TYPES} onChange={(event) => { addDraftFiles(event.target.files); event.currentTarget.value = ""; }} />
            <Button type="button" size="icon" variant="secondary" disabled={uploading} aria-label="Attach media or files" title="Attach media or files" onClick={() => attachmentInputRef.current?.click()}>
              {uploading ? <FileUp /> : <Paperclip />}
            </Button>
          </>
        ) : null}
        <textarea
          ref={textareaRef}
          name="body"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCursor(event.target.selectionStart);
          }}
          onClick={(event) => setCursor(event.currentTarget.selectionStart)}
          onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)}
          onKeyDown={(event) => {
            if (!suggestions.length) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((value) => (value + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((value) => (value - 1 + suggestions.length) % suggestions.length);
            } else if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              choose(suggestions[activeIndex]);
            } else if (event.key === "Escape") {
              setCursor(0);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls={`mentions-${taskId}`}
          rows={2}
          maxLength={2000}
          placeholder="Write a comment. @ is optional."
          className="min-h-12 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
        />
        <Button type="submit" size="icon" disabled={pending || uploading || (!text.trim() && !draftFiles.length)} aria-label="Post comment">
          <Send />
        </Button>
      </div>
      {fileError ? <p className="mt-2 text-xs text-danger">{fileError}</p> : null}
      {draftError ? <p className="mt-2 text-xs text-danger">{draftError}</p> : null}
      {commentError ? <p className="mt-2 text-xs text-danger">{commentError}</p> : null}
    </form>
  );
}

function DraftAttachment({ draft, onRemove }: { draft: { file: File; previewUrl: string | null }; onRemove: () => void }) {
  const kind = draft.file.type.startsWith("image/") ? "image" : draft.file.type.startsWith("video/") ? "video" : draft.file.type === "application/pdf" ? "pdf" : "file";
  return (
    <div className="relative flex min-h-24 w-full overflow-hidden rounded-lg border border-border bg-surface min-[520px]:w-[21rem]">
      <button type="button" onClick={onRemove} className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black" aria-label={`Remove ${draft.file.name}`}>
        <X className="h-3.5 w-3.5" />
      </button>
      <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-background p-1">
        {kind === "image" && draft.previewUrl ? (
          <img src={draft.previewUrl} alt={draft.file.name} className="max-h-full max-w-full object-contain" />
        ) : kind === "video" && draft.previewUrl ? (
          <video src={draft.previewUrl} muted preload="metadata" className="max-h-full max-w-full object-contain" />
        ) : kind === "pdf" ? (
          <FileText className="h-7 w-7 text-brand" />
        ) : (
          <Files className="h-7 w-7 text-brand" />
        )}
      </div>
      <div className="min-w-0 flex-1 px-3 py-2 pr-8">
        <p className="break-words text-xs font-medium leading-4">{draft.file.name}</p>
        <p className="text-[11px] text-muted-foreground">{sizeLabel(draft.file.size)}</p>
      </div>
    </div>
  );
}
