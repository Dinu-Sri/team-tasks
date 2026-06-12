"use client";

import { useActionState, useState } from "react";

import { updateTeamFeaturesAction } from "@/app/actions/features";
import { Button } from "@/components/ui/button";

export function FileSettingsForm({ teamId, teamName, commentsEnabled, initialLimit }: { teamId: string; teamName: string; commentsEnabled: boolean; initialLimit: number }) {
  const [state, action, pending] = useActionState(updateTeamFeaturesAction, {});
  const [limit, setLimit] = useState(initialLimit);
  return (
    <form action={action} className="rounded-lg border border-border bg-surface p-3">
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="attachmentsEnabled" value="on" />
      {commentsEnabled ? <input type="hidden" name="commentsEnabled" value="on" /> : null}
      <div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{teamName}</p><p className="text-xs text-muted-foreground">Per-file upload limit</p></div><span className="text-sm font-semibold">{limit} MB</span></div>
      <input name="attachmentLimitMb" type="range" min="5" max="25" step="5" value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-3 w-full accent-[hsl(var(--brand))]" />
      <div className="mt-2 flex items-center justify-between gap-3"><span className={`text-xs ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.success}</span><Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending ? "Saving..." : "Save limit"}</Button></div>
    </form>
  );
}
