"use client";

import Link from "next/link";
import { useActionState } from "react";

import { magicLinkAction, socialSignInAction, type AuthState } from "@/app/actions/auth";
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
  const [magicState, magicFormAction, magicPending] = useActionState(magicLinkAction, {});
  const signup = mode === "signup";

  return (
    <div className="space-y-4">
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
        {signup ? (
          <Input
            name="confirmPassword"
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        ) : null}
        {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
        <Button className="w-full" size="lg" disabled={pending}>
          {pending ? "Please wait" : signup ? "Create account" : "Log in"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>or</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-2">
          {["google", "github", "facebook"].map((provider) => (
            <form key={provider} action={socialSignInAction}>
              <input type="hidden" name="provider" value={provider} />
              <Button className="w-full capitalize" variant="secondary" type="submit">
                Continue with {provider}
              </Button>
            </form>
          ))}
        </div>

        {!signup ? (
          <form action={magicFormAction} className="space-y-2">
            <Input name="email" type="email" placeholder="Email for magic link" autoComplete="email" defaultValue={defaultEmail} required />
            {magicState.error ? <p className="text-sm text-danger">{magicState.error}</p> : null}
            {magicState.success ? <p className="text-sm text-success">{magicState.success}</p> : null}
            <Button className="w-full" variant="quiet" disabled={magicPending}>
              {magicPending ? "Sending link" : "Email me a sign-in link"}
            </Button>
          </form>
        ) : null}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {signup ? "Already have an account?" : "New here?"}{" "}
        <Link className="font-medium text-brand hover:underline" href={signup ? "/login" : "/signup"}>
          {signup ? "Log in" : "Create account"}
        </Link>
      </p>
    </div>
  );
}
