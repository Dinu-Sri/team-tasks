"use client";

import { useState } from "react";

import { TaskDetailPanel, type TaskDetail } from "@/components/tasks/task-detail-panel";

type ActivityComment = {
  id: string;
  taskId: string;
  body: string;
  createdAt: string;
  authorName: string;
  taskTitle: string;
  teamName: string;
  mentionedNames: string[];
};

export function ActivityDiscussionList({
  comments,
  tasks,
  currentUserId,
}: {
  comments: ActivityComment[];
  tasks: TaskDetail[];
  currentUserId: string;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
        {comments.map((comment) => (
          <button
            key={comment.id}
            type="button"
            onClick={() => setSelectedTaskId(comment.taskId)}
            className="flex min-h-36 w-full flex-col justify-between rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-brand/45 hover:bg-surface-subtle"
          >
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-semibold leading-5">{comment.taskTitle}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{comment.authorName}</p>
              <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{comment.body}</p>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">{comment.teamName}{comment.mentionedNames.length ? ` - mentioned ${comment.mentionedNames.join(", ")}` : ""}</span>
              <span className="shrink-0">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(comment.createdAt))}</span>
            </div>
          </button>
        ))}
      </div>
      {selectedTask ? <TaskDetailPanel task={selectedTask} currentUserId={currentUserId} onClose={() => setSelectedTaskId(null)} /> : null}
    </>
  );
}
