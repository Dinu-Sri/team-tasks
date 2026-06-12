"use client";

import { Check, Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import { toggleTaskAction } from "@/app/actions/tasks";

function CompletionControl({ title }: { title: string }) {
  const { pending } = useFormStatus();
  const [activated, setActivated] = useState(false);
  const completing = activated || pending;

  useEffect(() => {
    if (!activated || pending) return;
    const reset = setTimeout(() => setActivated(false), 700);
    return () => clearTimeout(reset);
  }, [activated, pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      data-completing={completing}
      onClick={() => setActivated(true)}
      className="task-complete-button"
      aria-label={completing ? `Completing ${title}` : `Complete ${title}`}
      title="Mark complete"
    >
      {completing ? <Check className="task-complete-check" /> : <Circle className="task-complete-circle" />}
    </button>
  );
}

export function CompleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  return (
    <form action={toggleTaskAction.bind(null, taskId)}>
      <CompletionControl title={title} />
    </form>
  );
}
