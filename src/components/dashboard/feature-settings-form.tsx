"use client";

import { CheckCheck, FileUp, MessageCircleMore, UsersRound } from "lucide-react";
import { useActionState, useState } from "react";

import { updateTeamFeaturesAction } from "@/app/actions/features";
import { Button } from "@/components/ui/button";

export function FeatureSettingsForm({
  teamId,
  commentsEnabled: initialComments,
  attachmentsEnabled: initialAttachments,
  memberTaskViewEnabled: initialMemberTaskView,
  finishedTaskViewEnabled: initialFinishedTaskView,
  attachmentLimitMb: initialLimit,
}: {
  teamId: string;
  commentsEnabled: boolean;
  attachmentsEnabled: boolean;
  memberTaskViewEnabled: boolean;
  finishedTaskViewEnabled: boolean;
  attachmentLimitMb: number;
}) {
  const [state, action, pending] = useActionState(updateTeamFeaturesAction, {});
  const [attachmentsEnabled, setAttachmentsEnabled] = useState(initialAttachments);
  const [limit, setLimit] = useState(initialLimit);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="teamId" value={teamId} />
      <label className="flex cursor-pointer items-start gap-3 border-b border-border pb-4">
        <input name="commentsEnabled" type="checkbox" defaultChecked={initialComments} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
        <MessageCircleMore className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Comments and mentions</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">Discuss a task, notify its participants, and request attention with mentions.</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 border-b border-border pb-4">
        <input name="attachmentsEnabled" type="checkbox" checked={attachmentsEnabled} onChange={(event) => setAttachmentsEnabled(event.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
        <FileUp className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">File attachments</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">Keep supporting documents inside the task, visible only to team members.</span>
        </span>
      </label>
      {attachmentsEnabled ? (
        <div className="rounded-lg bg-surface-subtle p-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor={`limit-${teamId}`} className="text-sm font-medium">Maximum file size</label>
            <span className="text-sm font-semibold">{limit} MB</span>
          </div>
          <input id={`limit-${teamId}`} name="attachmentLimitMb" type="range" min="5" max="25" step="5" value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-3 w-full accent-[hsl(var(--brand))]" />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>5 MB</span><span>25 MB</span></div>
        </div>
      ) : <input type="hidden" name="attachmentLimitMb" value={limit} />}
      <label className="flex cursor-pointer items-start gap-3">
        <input name="memberTaskViewEnabled" type="checkbox" defaultChecked={initialMemberTaskView} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
        <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Member task view</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">Let owners assign from Home and privately review each member's current task list.</span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 border-t border-border pt-4">
        <input name="finishedTaskViewEnabled" type="checkbox" defaultChecked={initialFinishedTaskView} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
        <CheckCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Finished task view</span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">Owners can see tasks completed by members and reopen them if needed.</span>
        </span>
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-xs ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.success}</span>
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
}
