"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email address
        </label>
        <Input id="email" name="email" type="email" required placeholder="you@example.com" className="h-11 bg-background shadow-sm" />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}

      <Button type="submit" className="h-11 w-full" disabled={pending}>
        {pending ? "Sending" : "Send reset link"}
      </Button>
    </form>
  );
}
