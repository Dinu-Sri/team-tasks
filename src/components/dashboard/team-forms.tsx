"use client";

import { useActionState } from "react";
import { Plus, Send } from "lucide-react";

import { createTeamTaskAction } from "@/app/actions/tasks";
import { createTeamAction, inviteMemberAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeamAction, {});
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <Input name="name" placeholder="New team name" required />
        <Button disabled={pending}><Plus />Create</Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function InviteForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState(inviteMemberAction, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="flex gap-2">
        <Input name="email" type="email" placeholder="Email address" required />
        <Button variant="secondary" disabled={pending}><Send />Invite</Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function AssignTaskForm({ teamId, members }: { teamId: string; members: Array<{ id: string; name: string }> }) {
  return (
    <form action={createTeamTaskAction} className="space-y-3">
      <input type="hidden" name="teamId" value={teamId} />
      <Input name="title" placeholder="Assign a task" required />
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <label key={member.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-2 text-sm">
            <input type="checkbox" name="assigneeIds" value={member.id} />
            {member.name}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <select name="due" className="h-10 rounded-full border border-border bg-surface px-3 text-sm">
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">Next week</option>
          <option value="none">No date</option>
        </select>
        <label className="flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm">
          <input type="checkbox" name="priority" value="HIGH" /> Important
        </label>
        <Button type="submit">Assign</Button>
      </div>
    </form>
  );
}

function FormMessage({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p className="text-xs text-danger">{state.error}</p>;
  if (state.success) return <p className="text-xs text-success">{state.success}</p>;
  return null;
}
