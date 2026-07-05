"use client";

import { Check, Circle, Undo2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { toggleTaskAction } from "@/app/actions/tasks";

const UNDO_GRACE_MS = 4000;

export function CompleteTaskButton({ taskId, title, onCompleted }: { taskId: string; title: string; onCompleted?: () => void }) {
  const [pending, startTransition] = useTransition();
  const [activated, setActivated] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const undoRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completing = activated || pending;

  const clearUndoTimer = useCallback(() => {
    if (undoRef.current) { clearTimeout(undoRef.current); undoRef.current = undefined; }
  }, []);

  useEffect(() => () => clearUndoTimer(), [clearUndoTimer]);

  function complete() {
    setActivated(true);
    startTransition(async () => {
      try {
        const result = await toggleTaskAction(taskId);
        if (result.completed) {
          setJustCompleted(true);
          undoRef.current = setTimeout(() => setJustCompleted(false), UNDO_GRACE_MS);
          onCompleted?.();
        }
      } finally {
        setActivated(false);
      }
    });
  }

  function undo() {
    if (undoing) return;
    setUndoing(true);
    startTransition(async () => {
      try {
        await toggleTaskAction(taskId);
        clearUndoTimer();
        setJustCompleted(false);
      } finally {
        setUndoing(false);
      }
    });
  }

  if (justCompleted && !undoing) {
    return (
      <button
        type="button"
        onClick={undo}
        className="task-undo-button"
        aria-label={`Undo completing ${title}`}
        title="Undo — you just marked this done"
      >
        <Undo2 className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={pending || undoing}
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
