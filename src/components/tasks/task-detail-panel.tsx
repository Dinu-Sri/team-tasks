"use client";

import { Download, FileUp, Files, MessageCircleMore, Paperclip, Send, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { addTaskCommentAction } from "@/app/actions/comments";
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
    mentions: Array<{ user: { id: string; name: string } }>;
  }>;
  attachments: Array<{
    id: string;
    originalName: string;
    size: number;
    uploader: { id: string; name: string };
  }>;
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [onClose]);

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

        {hasBoth ? <div className="grid grid-cols-2 border-b border-border p-1.5"><TabButton active={tab === "comments"} onClick={() => setTab("comments")} icon={<MessageCircleMore />} label={`Discussion ${task.comments.length ? `(${task.comments.length})` : ""}`} /><TabButton active={tab === "files"} onClick={() => setTab("files")} icon={<Paperclip />} label={`Files ${task.attachments.length ? `(${task.attachments.length})` : ""}`} /></div> : null}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {tab === "comments" && task.team.commentsEnabled ? <Discussion task={task} currentUserId={currentUserId} /> : null}
          {tab === "files" && task.team.attachmentsEnabled ? (
            <div className="p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Task files</h2><p className="text-xs text-muted-foreground">Up to {task.team.attachmentLimitMb} MB each.</p></div><input ref={fileRef} type="file" className="hidden" accept={ACCEPTED_ATTACHMENT_TYPES} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadFile(file); }} /><Button type="button" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}><FileUp />{uploading ? "Uploading..." : "Add file"}</Button></div>
              {fileError ? <p className="mb-3 text-sm text-danger">{fileError}</p> : null}
              {task.attachments.length ? <div className="divide-y divide-border rounded-lg border border-border">{task.attachments.map((file) => { const canDelete = file.uploader.id === currentUserId || task.team.currentUserRole === "OWNER"; return <div key={file.id} className="flex min-h-14 items-center gap-3 px-3 py-2.5"><Files className="h-4 w-4 shrink-0 text-brand" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.originalName}</p><p className="truncate text-xs text-muted-foreground">{sizeLabel(file.size)} - {file.uploader.name}</p></div><a href={`/api/attachments/${file.id}`} className={cn(buttonVariants({ variant: "quiet", size: "icon" }), "h-9 w-9")} aria-label={`Download ${file.originalName}`}><Download /></a>{canDelete ? <button type="button" onClick={() => void removeFile(file.id)} className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${file.originalName}`}><Trash2 className="h-4 w-4" /></button> : null}</div>; })}</div> : <div className="py-16 text-center"><Paperclip className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No files yet.</p></div>}
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button type="button" onClick={onClick} className={cn("flex h-10 items-center justify-center gap-2 rounded-full text-sm font-medium", active ? "bg-surface-subtle text-foreground" : "text-muted-foreground hover:text-foreground", "[&_svg]:h-4 [&_svg]:w-4")}>{icon}{label}</button>;
}

function Discussion({ task, currentUserId }: { task: TaskDetail; currentUserId: string }) {
  return <div className="flex min-h-[22rem] flex-col"><div className="flex-1 space-y-4 p-4 sm:p-5">{task.comments.length ? task.comments.map((comment) => <article key={comment.id} className={cn("max-w-[88%]", comment.author.id === currentUserId && "ml-auto")}><div className={cn("rounded-lg px-3 py-2.5", comment.author.id === currentUserId ? "bg-brand text-brand-foreground" : "bg-surface-subtle")}><p className="whitespace-pre-wrap break-words text-sm leading-5">{comment.body}</p></div><p className={cn("mt-1 px-1 text-xs text-muted-foreground", comment.author.id === currentUserId && "text-right")}>{comment.author.name} - {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(comment.createdAt))}</p></article>) : <div className="py-14 text-center"><MessageCircleMore className="mx-auto h-5 w-5 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">Ask for clarification here.</p></div>}</div><MentionComposer taskId={task.id} members={task.team.members.filter((member) => member.id !== currentUserId)} /></div>;
}

function MentionComposer({ taskId, members }: { taskId: string; members: TaskDetail["team"]["members"] }) {
  const [state, action, pending] = useActionState(addTaskCommentAction, {});
  const [text, setText] = useState("");
  const [selected, setSelected] = useState<Array<{ id: string; name: string }>>([]);
  const [cursor, setCursor] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const context = useMemo(() => { const before = text.slice(0, cursor); const at = before.lastIndexOf("@"); if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null; const query = before.slice(at + 1); if (query.includes("\n")) return null; return { at, query }; }, [cursor, text]);
  const suggestions = useMemo(() => context ? members.filter((member) => `${member.name} ${member.email}`.toLowerCase().includes(context.query.toLowerCase())).slice(0, 6) : [], [context, members]);
  const validSelected = selected.filter((member) => text.includes(`@${member.name}`));

  useEffect(() => { if (state.success) { setText(""); setSelected([]); } }, [state.success]);
  useEffect(() => setActiveIndex(0), [context?.query]);

  function choose(member: { id: string; name: string }) {
    if (!context) return;
    const replacement = `@${member.name} `;
    const next = text.slice(0, context.at) + replacement + text.slice(cursor);
    const nextCursor = context.at + replacement.length;
    setText(next); setSelected((items) => items.some(({ id }) => id === member.id) ? items : [...items, member]); setCursor(nextCursor);
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(nextCursor, nextCursor); });
  }

  return <form action={action} className="relative border-t border-border p-3 sm:p-4"><input type="hidden" name="taskId" value={taskId} />{validSelected.map((member) => <input key={member.id} type="hidden" name="mentionedUserIds" value={member.id} />)}{suggestions.length ? <div id={`mentions-${taskId}`} role="listbox" className="absolute bottom-full left-3 right-3 mb-1 max-h-52 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-soft sm:left-4 sm:right-auto sm:w-80">{suggestions.map((member, index) => <button key={member.id} type="button" role="option" aria-selected={index === activeIndex} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(member)} className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left", index === activeIndex ? "bg-surface-subtle" : "hover:bg-surface-subtle")}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{member.name}</span><span className="block truncate text-xs text-muted-foreground">{member.email}</span></span></button>)}</div> : null}<div className="flex items-end gap-2"><textarea ref={textareaRef} name="body" value={text} onChange={(event) => { setText(event.target.value); setCursor(event.target.selectionStart); }} onClick={(event) => setCursor(event.currentTarget.selectionStart)} onKeyUp={(event) => setCursor(event.currentTarget.selectionStart)} onKeyDown={(event) => { if (!suggestions.length) return; if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((value) => (value + 1) % suggestions.length); } else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((value) => (value - 1 + suggestions.length) % suggestions.length); } else if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); choose(suggestions[activeIndex]); } else if (event.key === "Escape") { setCursor(0); } }} role="combobox" aria-autocomplete="list" aria-expanded={suggestions.length > 0} aria-controls={`mentions-${taskId}`} rows={2} maxLength={2000} placeholder="Write a comment. Type @ to mention someone." className="min-h-12 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" required /><Button type="submit" size="icon" disabled={pending || !text.trim()} aria-label="Post comment"><Send /></Button></div>{state.error ? <p className="mt-2 text-xs text-danger">{state.error}</p> : null}</form>;
}
