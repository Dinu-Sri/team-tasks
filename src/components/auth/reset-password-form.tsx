"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">New password</label>
        <Input id="password" name="password" type="password" required minLength={8} placeholder="At least 8 characters" />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">Confirm password</label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} placeholder="Repeat your password" />
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Resetting" : "Reset password"}
      </Button>
    </form>
  );
}
