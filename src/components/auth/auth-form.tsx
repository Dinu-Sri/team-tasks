"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
  defaultEmail,
}: {
  mode: "login" | "signup";
  action: AuthAction;
  defaultEmail?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const signup = mode === "signup";

  return (
    <form action={formAction} className="space-y-3">
      {signup ? <Input name="name" placeholder="Your name" autoComplete="name" required /> : null}
      <Input name="email" type="email" placeholder="Email address" autoComplete="email" defaultValue={defaultEmail} required />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete={signup ? "new-password" : "current-password"}
        minLength={8}
        required
      />
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "Please wait" : signup ? "Create account" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {signup ? "Already have an account?" : "New here?"}{" "}
        <Link className="font-medium text-brand hover:underline" href={signup ? "/login" : "/signup"}>
          {signup ? "Log in" : "Create account"}
        </Link>
      </p>
    </form>
  );
}
