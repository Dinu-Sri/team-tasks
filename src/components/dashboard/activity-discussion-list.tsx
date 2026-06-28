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
      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <button
            key={comment.id}
            type="button"
            onClick={() => setSelectedTaskId(comment.taskId)}
            className="block w-full px-4 py-4 text-left hover:bg-surface-subtle"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{comment.authorName} - {comment.taskTitle}</p>
              <span className="shrink-0 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(comment.createdAt))}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{comment.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{comment.teamName}{comment.mentionedNames.length ? ` - mentioned ${comment.mentionedNames.join(", ")}` : ""}</p>
          </button>
        ))}
      </div>
      {selectedTask ? <TaskDetailPanel task={selectedTask} currentUserId={currentUserId} onClose={() => setSelectedTaskId(null)} /> : null}
    </>
  );
}
