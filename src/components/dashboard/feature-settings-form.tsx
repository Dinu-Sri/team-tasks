"use client";

import { CheckCheck, FileUp, MessageCircleMore, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
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
      <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]">
        <ToolToggle
          name="commentsEnabled"
          defaultChecked={initialComments}
          icon={<MessageCircleMore className="h-5 w-5" />}
          title="Comments and mentions"
          description="Talk inside tasks and mention people when attention is needed."
        />
        <label className="flex min-h-36 cursor-pointer flex-col justify-between rounded-lg border border-border bg-background p-4">
          <span className="flex items-start gap-3">
            <input name="attachmentsEnabled" type="checkbox" checked={attachmentsEnabled} onChange={(event) => setAttachmentsEnabled(event.target.checked)} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <FileUp className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">File attachments</span>
              <span className="mt-1 block text-sm leading-5 text-muted-foreground">Add documents, screenshots, and references to tasks.</span>
            </span>
          </span>
          {attachmentsEnabled ? (
            <span className="mt-4 block rounded-lg bg-surface-subtle p-3">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Maximum file size</span>
                <span className="text-sm font-semibold">{limit} MB</span>
              </span>
              <input id={`limit-${teamId}`} name="attachmentLimitMb" type="range" min="5" max="25" step="5" value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-3 w-full accent-[hsl(var(--brand))]" />
              <span className="mt-1 flex justify-between text-xs text-muted-foreground"><span>5 MB</span><span>25 MB</span></span>
            </span>
          ) : <input type="hidden" name="attachmentLimitMb" value={limit} />}
        </label>
        <ToolToggle
          name="memberTaskViewEnabled"
          defaultChecked={initialMemberTaskView}
          icon={<UsersRound className="h-5 w-5" />}
          title="See member tasks"
          description="Owners can review each member's open work."
        />
        <ToolToggle
          name="finishedTaskViewEnabled"
          defaultChecked={initialFinishedTaskView}
          icon={<CheckCheck className="h-5 w-5" />}
          title="Review finished tasks"
          description="Owners can see completed work and reopen items."
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className={`text-xs ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.success}</span>
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>{pending ? "Saving..." : "Save settings"}</Button>
      </div>
    </form>
  );
}

function ToolToggle({
  name,
  defaultChecked,
  icon,
  title,
  description,
}: {
  name: string;
  defaultChecked: boolean;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <label className="flex min-h-36 cursor-pointer items-start gap-3 rounded-lg border border-border bg-background p-4">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-[hsl(var(--brand))]" />
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}
