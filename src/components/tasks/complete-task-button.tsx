"use client";

import { Check, Circle } from "lucide-react";
import { useState, useTransition } from "react";

import { toggleTaskAction } from "@/app/actions/tasks";
import { MOMENTUM_CELEBRATION_EVENT } from "@/components/momentum/momentum-celebration";

export function CompleteTaskButton({ taskId, title }: { taskId: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [activated, setActivated] = useState(false);
  const completing = activated || pending;

  function complete() {
    setActivated(true);
    startTransition(async () => {
      try {
        const result = await toggleTaskAction(taskId);
        window.dispatchEvent(new CustomEvent(MOMENTUM_CELEBRATION_EVENT, { detail: result }));
      } finally {
        setActivated(false);
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      data-completing={completing}
      onClick={complete}
      className="task-complete-button"
      aria-label={completing ? `Completing ${title}` : `Complete ${title}`}
      title="Mark complete"
    >
      {completing ? <Check className="task-complete-check" /> : <Circle className="task-complete-circle" />}
    </button>
  );
}
