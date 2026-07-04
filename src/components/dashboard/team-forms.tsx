"use client";

import { useActionState } from "react";
import { Plus, Send } from "lucide-react";

import { createTeamAction, inviteMemberAction } from "@/app/actions/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateTeamForm() {
  const [state, action, pending] = useActionState(createTeamAction, {});
  return (
    <form action={action} className="space-y-2">
      <div className="grid gap-2 min-[420px]:grid-cols-[1fr_auto]">
        <Input name="name" placeholder="Team name" required />
        <Button className="w-full min-[420px]:w-auto" disabled={pending}><Plus />Create team</Button>
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
      <div className="grid gap-2 min-[420px]:grid-cols-[1fr_auto]">
        <Input name="email" type="email" placeholder="Email address" required />
        <Button className="w-full min-[420px]:w-auto" variant="secondary" disabled={pending}><Send />Send invite</Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

function FormMessage({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p className="text-xs text-danger">{state.error}</p>;
  if (state.success) return <p className="text-xs text-success">{state.success}</p>;
  return null;
}
