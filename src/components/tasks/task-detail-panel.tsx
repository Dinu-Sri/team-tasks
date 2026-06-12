"use client";

import { CheckCheck, Download, Eye, FileUp, Files, ImageIcon, MessageCircleMore, Paperclip, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { addTaskCommentAction, markTaskCommentsReadAction } from "@/app/actions/comments";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

const ACCEPTED_ATTACHMENT_TYPES = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

export type TaskDetail = {
  id: string;
  title: string;
  note: string | null;
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

  async function uploadFile(file: File) {
    setFileError("");
    if (file.size > task.team.attachmentLimitMb * 1024 * 1024) { setFileError(`This team allows files up to ${task.team.attachmentLimitMb} MB.`); return; }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch(`/api/tasks/${task.id}/attachments`, { method: "POST", body });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed.");
      router.refresh();
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "Upload failed.");
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
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-foreground/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label={task.title} className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg border border-border bg-surface shadow-soft sm:max-h-[84vh] sm:rounded-lg">
        <header className="flex items-start gap-3 border-b border-border px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1"><p className="break-words text-base font-semibold sm:text-lg">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{task.team.name}</p>{task.note ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{task.note}</p> : null}</div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close task"><X className="h-4 w-4" /></button>
        </header>

        {hasBoth ? <div className="grid grid-cols-2 border-b border-border p-1.5"><TabButton active={tab === "comments"} onClick={() => setTab("comments")} icon={<MessageCircleMore />} label={`Discussion ${task.comments.length ? `(${task.comments.length})` : ""}`} unread={task.unreadCommentCount} /><TabButton active={tab === "files"} onClick={() => setTab("files")} icon={<Paperclip />} label={`Files ${task.attachments.length ? `(${task.attachments.length})` : ""}`} /></div> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {tab === "comments" && task.team.commentsEnabled ? <Discussion task={task} currentUserId={currentUserId} /> : null}
          {tab === "files" && task.team.attachmentsEnabled ? (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Task files</h2><p className="text-xs text-muted-foreground">Up to {task.team.attachmentLimitMb} MB each.</p></div><input ref={fileRef} type="file" className="hidden" accept={ACCEPTED_ATTACHMENT_TYPES} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} /><Button type="button" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}><FileUp />{uploading ? "Uploading..." : "Add file"}</Button></div>
              {fileError ? <p className="mb-3 text-sm text-danger">{fileError}</p> : null}
              {task.attachments.length ? <div className="divide-y divide-border rounded-lg border border-border">{task.attachments.map((file) => { const canDelete = file.uploader.id === currentUserId || task.team.currentUserRole === "OWNER"; const image = file.mimeType.startsWith("image/"); return <div key={file.id} className="flex min-h-14 items-center gap-3 px-3 py-2.5">{image ? <ImageIcon className="h-4 w-4 shrink-0 text-brand" /> : <Files className="h-4 w-4 shrink-0 text-brand" />}<div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.originalName}</p><p className="truncate text-xs text-muted-foreground">{sizeLabel(file.size)} - {file.uploader.name}</p></div>{image ? <ImagePreview attachmentId={file.id} name={file.originalName} /> : null}<a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "h-9 w-9")} aria-label={`Download ${file.originalName}`}><Download /></a>{canDelete ? <button type="button" onClick={() => void removeFile(file.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${file.originalName}`}><Trash2 className="h-4 w-4" /></button> : null}</div>; })}</div> : <div className="py-16 text-center"><Paperclip className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No files yet.</p></div>}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function TabButton({ active, onClick, icon, label, unread = 0 }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; unread?: number }) {
  return <button type="button" onClick={onClick} className={cn("relative flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium", active ? "bg-surface-subtle text-foreground" : "text-muted-foreground hover:text-foreground", "[&_svg]:h-4 [&_svg]:w-4")}>{icon}{label}{unread ? <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{unread}</span> : null}</button>;
}

function Discussion({ task, currentUserId }: { task: TaskDetail; currentUserId: string }) {
  return <div className="flex min-h-[22rem] flex-col"><div className="flex-1 space-y-4 p-4 sm:p-5">{task.comments.length ? task.comments.map((comment) => { const own = comment.author.id === currentUserId; const attentionReceipts = comment.receipts.filter(({ requiresAttention }) => requiresAttention); const relevantReceipts = attentionReceipts.length ? attentionReceipts : comment.receipts; const readCount = relevantReceipts.filter(({ readAt }) => readAt).length; const allRead = relevantReceipts.length > 0 && readCount === relevantReceipts.length; return <article key={comment.id} className={cn("max-w-[88%]", own && "ml-auto")}><div className={cn("rounded-lg px-3 py-2.5", own ? "bg-brand text-brand-foreground" : "bg-surface-subtle")}><p className="whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p></div><div className={cn("mt-1 flex items-center gap-1 px-1 text-xs text-muted-foreground", own && "justify-end text-right")}><span>{comment.author.name} - {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(comment.createdAt))}</span>{own && relevantReceipts.length ? <span className={cn("flex items-center gap-1", allRead && "text-blue-600 dark:text-blue-300")} title={`${readCount} of ${relevantReceipts.length} read`}><CheckCheck className="h-3.5 w-3.5" />{readCount}/{relevantReceipts.length}</span> : null}</div></article>; }) : <div className="py-14 text-center"><MessageCircleMore className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Ask for clarification here.</p></div>}</div><MentionComposer taskId={task.id} members={task.team.members.filter((member) => member.id !== currentUserId)} /></div>;
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

function MentionComposer({ taskId, members }: { taskId: string; members: TaskDetail["team"]["members"] }) {
  const [state, action, pending] = useActionState(addTaskCommentAction, {});
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<MentionOption[]>([]);
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const context = useMemo(() => { const before = text.slice(0, cursor); const at = before.lastIndexOf("@"); if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null; const query = before.slice(at + 1); if (query.includes("\n")) return null; return { at, query }; }, [cursor, text]);
  const suggestions = useMemo(() => {
    if (!context) return [];
    const query = context.query.toLowerCase();
    const all: MentionOption = { id: "__all__", name: "all", email: "Notify everyone in this team" };
    return [all, ...members].filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(query)).slice(0, 6);
  }, [context, members]);
  const validSelected = selected.filter((member) => text.includes(`@${member.name}`));

  useEffect(() => { if (state.success) { setText(""); setSelected([]); } }, [state.success]);
  useEffect(() => setActiveIndex(0), [context?.query]);

  function choose(member: MentionOption) {
    if (!context) return;
    const replacement = `@${member.name} `;
    const next = text.slice(0, context.at) + replacement + text.slice(cursor);
    const nextCursor = context.at + replacement.length;
    setText(next); setSelected((items) => items.some(({ id }) => id === member.id) ? items : [...items, member]); setCursor(nextCursor);
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(nextCursor, nextCursor); });
  }

  return <form action={action} className="relative border-t border-border p-3 sm:p-4"><input type="hidden" name="taskId" value={taskId} />{validSelected.filter(({ id }) => id !== "__all__").map((member) => <input key={member.id} type="hidden" name="mentionedUserIds" value={member.id} />)}{suggestions.length ? <div id={`mentions-${taskId}`} role="listbox" className="absolute bottom-full left-3 right-3 mb-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-soft sm:left-4 sm:right-auto sm:w-80">{suggestions.map((member, index) => <button key={member.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(member)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", index === activeIndex ? "bg-surface-subtle" : "hover:bg-surface-subtle")}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{member.id === "__all__" ? "ALL" : member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">@{member.name}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span></button>)}</div> : null}<div className="flex items-end gap-2"><textarea ref={textareaRef} name="body" value={text} onChange={(event) => { setText(event.target.value); setCursor(event.target.selectionStart); }} onClick={(event) => setCursor(event.currentTarget.selectionStart)} onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)} onKeyDown={(event) => { if (!suggestions.length) return; if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => (value + 1) % suggestions.length); } else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => (value - 1 + suggestions.length) % suggestions.length); } else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); choose(suggestions[activeIndex]); } else if (event.key === "Escape") { setCursor(0); } }} role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0} aria-controls={`mentions-${taskId}`} rows={2} maxLength={2000} placeholder="Write a comment. @ is optional." className="min-h-12 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required /><Button type="submit" size="icon" disabled={pending || !text.trim()} aria-label="Post comment"><Send /></Button></div>{state.error ? <p className="mt-2 text-xs text-danger">{state.error}</p> : null}</form>;
}
