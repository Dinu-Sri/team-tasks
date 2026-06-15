"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Eye, ListChecks, MessageCircleMore, Paperclip, Pencil, Plus, Undo2, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createPersonalTaskAction, toggleTaskAction, updateTaskAction } from "@/app/actions/tasks";
import { getCompletedMemberTasksAction, type CompletedMemberTask } from "@/app/actions/completed-tasks";
import { acceptInviteAction } from "@/app/actions/teams";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { CompletedTasksPanel } from "@/components/tasks/completed-tasks-panel";
import { FloatingActionMenu, CompletedToast } from "@/components/tasks/floating-action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskDetailPanel, type TaskDetail } from "@/components/tasks/task-detail-panel";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { MEMBER_TASK_VIEW_EVENT } from "@/lib/member-task-view";
import { cn } from "@/lib/utils";

type TeamOption = { id: string; name: string; canAssignMembers: boolean; members: Array<{ id: string; name: string }> };
type TaskItem = {
  id: string;
  title: string;
  status: "OPEN" | "DONE";
  priority: "NORMAL" | "HIGH";
  dueAt: string | null;
  editNote?: string | null;
  editedAt?: string | null;
} & TaskDetail;
type MemberTaskSummary = { id: string; title: string; priority: "NORMAL" | "HIGH"; dueAt: string | null; teamName: string; editNote?: string | null; editedAt?: string | null };
type MemberTaskGroup = { id: string; memberName: string; teamName: string; tasks: MemberTaskSummary[]; teamId: string };

function dueLabel(dueAt: string | null) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const dayDiff = Math.round((startOfDue.getTime() - startOfToday.getTime()) / 86400000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Tomorrow";
  if (dayDiff === -1) return "Yesterday";
  if (dayDiff === -2) return "Day before yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(due);
}

function timeAgoShort(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type PendingInvite = { id: string; token: string; teamName: string; inviterName: string };

export function PersonalTasks({
  tasks,
  discussionUpdates,
  memberTaskGroups,
  pendingInvites,
  teams,
  currentUserId,
  initialTaskId,
  focusedTask,
  workspaceId,
  workspaceRole,
  finishedTaskViewEnabled = false,
}: {
  tasks: TaskItem[];
  discussionUpdates: TaskItem[];
  memberTaskGroups: MemberTaskGroup[];
  pendingInvites: PendingInvite[];
  teams: TeamOption[];
  currentUserId: string;
  initialTaskId?: string;
  focusedTask?: TaskItem;
  workspaceId?: string;
  workspaceRole?: "OWNER" | "MEMBER" | null;
  finishedTaskViewEnabled?: boolean;
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [memberView, setMemberView] = useState(false);
  const [memberIndex, setMemberIndex] = useState(0);
  const [selectedTeamId, setSelectedTeamId] = useState(() => {
    if (workspaceId && workspaceId !== "__all__") return workspaceId;
    return teams[0]?.id ?? "";
  });
  const [assigneeId, setAssigneeId] = useState(currentUserId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [lastCompleted, setLastCompleted] = useState<{ id: string; title: string } | null>(null);
  const [showCompletedToast, setShowCompletedToast] = useState(false);
  const [showCompletedPanel, setShowCompletedPanel] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<CompletedMemberTask[]>([]);
  const selectedTeam = teams.find(({ id }) => id === selectedTeamId);
  // For the add form, when workspace is set, use the workspace's team for member selection
  const effectiveTeam = isAllWorkspaces ? selectedTeam : teams.find(({ id }) => id === workspaceTeamId) ?? selectedTeam;

  const isOwnerInWorkspace = workspaceRole === "OWNER";
  // Hide Add when "All" is selected (user should pick a workspace first) unless they are owner somewhere
  const isAllWorkspaces = workspaceId === "__all__" || !workspaceId;
  const showAddButton = !memberView && !isAllWorkspaces && isOwnerInWorkspace;
  const showTeamName = isAllWorkspaces;
  // When a specific workspace is selected, pre-fill teamId from workspace
  const workspaceTeamId = isAllWorkspaces ? null : workspaceId;

  const onTaskCompleted = useCallback((taskId: string, title: string) => {
    setLastCompleted({ id: taskId, title });
    setShowCompletedToast(true);
  }, []);

  const handleUndoLast = useCallback(() => {
    if (!lastCompleted) return;
    const taskId = lastCompleted.id;
    setLastCompleted(null);
    setShowCompletedToast(false);
    startTransition(async () => {
      try {
        await toggleTaskAction(taskId);
        router.refresh();
      } catch {
        // ignore
      }
    });
  }, [lastCompleted, router]);

  const openCompletedPanel = useCallback(async () => {
    setShowCompletedPanel(true);
    const teamIds = workspaceTeamId
      ? [workspaceTeamId]
      : teams.filter(t => t.canAssignMembers).map(t => t.id);

    const results: CompletedMemberTask[] = [];
    for (const teamId of teamIds) {
      try {
        const fetched = await getCompletedMemberTasksAction(teamId);
        results.push(...fetched);
      } catch {
        // ignore
      }
    }
    results.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    setCompletedTasks(results);
  }, [workspaceId, teams]);

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const next = Boolean((event as CustomEvent<boolean>).detail) && memberTaskGroups.length > 0;
      setMemberView(next);
      setShowAdd(false);
      setSelectedTaskId(null);
    };
    window.addEventListener(MEMBER_TASK_VIEW_EVENT, handleToggle);

    const handleOnbordaAddStep = () => {
      if (!memberView && showAddButton) {
        setShowAdd(true);
      }
    };
    window.addEventListener("onborda-add-step-open", handleOnbordaAddStep);

    return () => {
      window.removeEventListener(MEMBER_TASK_VIEW_EVENT, handleToggle);
      window.removeEventListener("onborda-add-step-open", handleOnbordaAddStep);
    };
  }, [memberTaskGroups.length, memberView, showAddButton]);
  useEffect(() => { if (!memberTaskGroups.length) setMemberView(false); setMemberIndex((value) => Math.min(value, Math.max(0, memberTaskGroups.length - 1))); }, [memberTaskGroups.length]);
  useEffect(() => {
    const members = effectiveTeam?.members ?? [];
    setAssigneeId(members.some(({ id }) => id === currentUserId) ? currentUserId : members[0]?.id ?? "");
  }, [currentUserId, effectiveTeam]);
  useEffect(() => { if (initialTaskId && (tasks.some(({ id }) => id === initialTaskId) || discussionUpdates.some(({ id }) => id === initialTaskId) || focusedTask?.id === initialTaskId)) setSelectedTaskId(initialTaskId); }, [discussionUpdates, focusedTask?.id, initialTaskId, tasks]);
  const selectedTask = tasks.find(({ id }) => id === selectedTaskId) ?? discussionUpdates.find(({ id }) => id === selectedTaskId) ?? (focusedTask?.id === selectedTaskId ? focusedTask : undefined);

  useKeyboardShortcuts({
    onAddTask: () => { if (!memberView && showAddButton) setShowAdd(true); },
    canAddTask: !memberView && showAddButton,
  });

  function openTask(task: TaskItem) {
    setSelectedTaskId(task.id);
    router.replace(`/?task=${encodeURIComponent(task.id)}`, { scroll: false });
  }

  function closeTask() {
    setSelectedTaskId(null);
    router.replace("/", { scroll: false });
  }

  const fabActions = [];
  if (isOwnerInWorkspace && finishedTaskViewEnabled) {
    fabActions.push({
      id: "completed",
      icon: <ListChecks className="h-4 w-4" />,
      label: "Finished tasks",
      onClick: openCompletedPanel,
    });
  }
  if (lastCompleted) {
    fabActions.push({
      id: "undo",
      icon: <Undo2 className="h-4 w-4" />,
      label: "Undo last complete",
      onClick: handleUndoLast,
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{memberView ? "Member tasks" : "My tasks"}</h1>
        {showAddButton ? <Button size="sm" id="onborda-add-task" onClick={() => setShowAdd((value) => !value)}>
          {showAdd ? <X /> : <Plus />}
          {showAdd ? "Close" : "Add"}
        </Button> : null}
      </div>

      {!memberView && showAdd ? (
        <form action={createPersonalTaskAction} id="onborda-add-task-form" className="task-view-enter mb-3 grid gap-2 rounded-lg border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
          <Input name="title" placeholder="What needs to be done?" autoFocus required />
          {isAllWorkspaces ? (
            <select name="teamId" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className="h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm" aria-label="Team" required>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          ) : (
            <input type="hidden" name="teamId" value={workspaceTeamId ?? teams[0]?.id ?? ""} />
          )}
          {effectiveTeam?.canAssignMembers ? <select name="assigneeId" value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)} className="h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm" aria-label="Assign to" required>{effectiveTeam.members.map((member) => <option key={member.id} value={member.id}>{member.id === currentUserId ? "Me" : member.name}</option>)}</select> : <input type="hidden" name="assigneeId" value={currentUserId} />}
          <select name="due" className="h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm">
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">Next week</option>
            <option value="none">No date</option>
          </select>
          <Button className="w-full" type="submit"><Check />Add</Button>
        </form>
      ) : null}

      {memberView ? (
        <div className="task-view-enter">
          <MemberTaskCarousel groups={memberTaskGroups} index={memberIndex} onIndexChange={setMemberIndex} isOwner={isOwnerInWorkspace} />
        </div>
      ) : (
        <div className="task-view-enter">
          {pendingInvites.length ? (
            <section className="mb-4 space-y-2">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{invite.inviterName} invited you to {invite.teamName}</p>
                  </div>
                  <form action={acceptInviteAction}>
                    <input type="hidden" name="token" value={invite.token} />
                    <Button size="sm" type="submit">Accept</Button>
                  </form>
                </div>
              ))}
            </section>
          ) : null}
          {discussionUpdates.length ? (
            <section className="mb-4 overflow-hidden rounded-lg border border-border bg-surface">
              <div className="border-b border-border px-4 py-3 sm:px-6">
                <h2 className="text-sm font-semibold">Discussion updates</h2>
              </div>
              <div className="divide-y divide-border">
                {discussionUpdates.map((task) => (
                  <button key={task.id} type="button" onClick={() => openTask(task)} className={cn("relative flex min-h-20 w-full items-center gap-3 px-4 py-4 text-left hover:bg-surface-subtle sm:gap-4 sm:px-6", task.hasMentionAttention && "task-mention-attention")}>
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <MessageCircleMore className="h-5 w-5" />
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">{task.unreadCommentCount}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-base font-semibold leading-6">{task.title}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{showTeamName ? `${task.team.name} - ` : ""}{task.status === "DONE" ? "Archived task - " : ""}{task.hasMentionAttention ? "Your attention was requested" : "New discussion"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section id="onborda-task-list" className="overflow-hidden rounded-lg border border-border bg-surface">
            {tasks.length ? (
              <div className="divide-y divide-border">
                {tasks.map((task) => {
                  const due = dueLabel(task.dueAt);
                  return (
                    <div key={task.id} className={cn("relative flex min-h-24 items-start gap-3 px-4 py-5 sm:items-center sm:gap-4 sm:px-6", task.hasMentionAttention && "task-mention-attention")}>
                      <CompleteTaskButton taskId={task.id} title={task.title} onCompleted={() => onTaskCompleted(task.id, task.title)} />
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-base font-semibold leading-6 sm:text-lg">{task.title}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          {showTeamName ? <span>{task.team.name}</span> : null}
                          {showTeamName && due ? <span>-</span> : null}
                          {due ? <span className={due === "Today" ? "text-warning" : ""}><CalendarDays className="mr-1 inline h-4 w-4" />{due}</span> : null}
                          {task.priority === "HIGH" ? <Badge className="sm:hidden" variant="danger">Important</Badge> : null}
                          {task.editNote ? (
                            <span className="flex items-center gap-1 text-xs text-brand" title={task.editNote}>
                              <Pencil className="h-3 w-3" />
                              {task.editNote} {task.editedAt ? `· ${timeAgoShort(task.editedAt)}` : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {task.team.commentsEnabled || task.team.attachmentsEnabled ? <button type="button" onClick={() => openTask(task)} className="flex min-h-10 shrink-0 items-center gap-2 rounded-full px-2.5 text-sm text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label={`Open details for ${task.title}`}>{task.team.commentsEnabled ? <span className="relative flex items-center gap-1"><MessageCircleMore className={cn("h-4 w-4", task.unreadCommentCount > 0 && "text-brand")} /><span>{task.comments.length || ""}</span>{task.unreadCommentCount ? <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-semibold text-white">{task.unreadCommentCount}</span> : null}</span> : null}{task.team.attachmentsEnabled ? <span className="flex items-center gap-1"><Paperclip className="h-4 w-4" /><span>{task.attachments.length || ""}</span></span> : null}</button> : null}
                      {task.priority === "HIGH" ? <Badge className="hidden shrink-0 sm:inline-flex" variant="danger">Important</Badge> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center text-sm text-muted-foreground">Nothing to do.</div>
            )}
          </section>
        </div>
      )}
      {selectedTask ? <TaskDetailPanel task={selectedTask} currentUserId={currentUserId} onClose={closeTask} /> : null}

      {/* Always-visible FAB — icon changes based on owner status */}
      <FloatingActionMenu
        actions={fabActions}
        isOwner={isOwnerInWorkspace}
        hasLastCompleted={!!lastCompleted}
      />

      {/* Temporary toast when a task is completed */}
      {showCompletedToast && lastCompleted ? (
        <CompletedToast
          taskTitle={lastCompleted.title}
          onUndo={handleUndoLast}
          onDismiss={() => setShowCompletedToast(false)}
        />
      ) : null}

      {showCompletedPanel ? (
        <CompletedTasksPanel
          tasks={completedTasks}
          canUndo={isOwnerInWorkspace}
          onClose={() => setShowCompletedPanel(false)}
        />
      ) : null}
    </div>
  );
}

function MemberTaskCarousel({
  groups,
  index,
  onIndexChange,
  isOwner,
}: {
  groups: MemberTaskGroup[];
  index: number;
  onIndexChange: (index: number) => void;
  isOwner: boolean;
}) {
  const touchStart = useRef<number | null>(null);
  const router = useRouter();
  const [direction, setDirection] = useState<1 | -1>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const group = groups[index];

  function move(offset: number) {
    if (groups.length < 2) return;
    setDirection(offset > 0 ? 1 : -1);
    onIndexChange((index + offset + groups.length) % groups.length);
  }

  function startEdit(task: MemberTaskSummary) {
    setEditingId(task.id);
    setEditTitle(task.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function handleSave(taskId: string) {
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    const formData = new FormData();
    formData.set("taskId", taskId);
    formData.set("title", editTitle.trim());
    formData.set("priority", "NORMAL");
    formData.set("due", "none");
    try {
      await updateTaskAction(undefined, formData);
      setEditingId(null);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  if (!group) return <section className="rounded-lg border border-border bg-surface py-20 text-center text-sm text-muted-foreground">No team members to review.</section>;

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Member task viewer" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current === null) return; const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current; if (Math.abs(distance) > 48) move(distance < 0 ? 1 : -1); touchStart.current = null; }}>
      <header className="flex min-h-16 items-center gap-3 border-b border-border px-3 py-2.5 sm:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><UsersRound className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{group.memberName}</p><p className="truncate text-xs text-muted-foreground">{group.teamName} - {group.tasks.length} open</p></div>
        {groups.length > 1 ? <div className="flex items-center gap-1"><button type="button" onClick={() => move(-1)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Previous team member"><ChevronLeft className="h-5 w-5" /></button><span className="min-w-10 text-center text-xs text-muted-foreground">{index + 1}/{groups.length}</span><button type="button" onClick={() => move(1)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Next team member"><ChevronRight className="h-5 w-5" /></button></div> : null}
      </header>
      <div className="overflow-hidden">
        <div key={group.id} className={direction > 0 ? "member-slide-next" : "member-slide-previous"}>
          {group.tasks.length ? (
            <div className="divide-y divide-border">
              {group.tasks.map((task) => {
                const due = dueLabel(task.dueAt);
                const isEditing = editingId === task.id;
                return (
                  <div key={task.id} className="flex min-h-20 items-center gap-3 px-4 py-4 sm:px-6">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-muted-foreground">
                      <Eye className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {isEditing && isOwner ? (
                        <div className="flex items-center gap-2">
                          <input type="hidden" name="taskId" value={task.id} />
                          <Input
                            name="title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-9 text-sm"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") handleSave(task.id); }}
                          />
                          <Button type="button" size="sm" className="h-9" disabled={saving} onClick={() => handleSave(task.id)}>{saving ? "Saving..." : "Save"}</Button>
                          <Button type="button" size="sm" variant="secondary" className="h-9" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                        </div>
                      ) : (
                        <>
                          <p className="break-words text-base font-semibold leading-6">{task.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            {due ? <span className={due === "Today" ? "text-warning" : ""}><CalendarDays className="mr-1 inline h-4 w-4" />{due}</span> : null}
                            {due && task.priority === "HIGH" ? <span>-</span> : null}
                            {task.priority === "HIGH" ? <Badge variant="danger">Important</Badge> : null}
                            {task.editNote ? (
                              <span className="flex items-center gap-1 text-xs text-brand" title={task.editNote}>
                                <Pencil className="h-3 w-3" />
                                {task.editNote} {task.editedAt ? `· ${timeAgoShort(task.editedAt)}` : ""}
                              </span>
                            ) : null}
                          </div>
                        </>
                      )}
                    </div>
                    {isOwner && !isEditing ? (
                      <button
                        type="button"
                        onClick={() => startEdit(task)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-brand/10 hover:text-brand transition-colors"
                        aria-label={`Edit ${task.title}`}
                        title="Edit this task"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-sm text-muted-foreground">No open tasks for {group.memberName}.</div>
          )}
        </div>
      </div>
    </section>
  );
}
