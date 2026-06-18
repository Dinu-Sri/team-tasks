"use client";

import { Eye, EyeOff, Github } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";

import { socialSignInAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const signup = mode === "signup";

  return (
    <section className="w-full max-w-[448px]">
      <div className="flex">
        <AuthTab href="/login" active={!signup}>
          Sign In
        </AuthTab>
        <AuthTab href="/login?mode=signup" active={signup}>
          Sign Up
        </AuthTab>
      </div>

      <div className="border border-border bg-surface px-6 py-7 shadow-sm sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">{signup ? "Sign Up" : "Sign In"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {signup ? "Enter your email below to create an account" : "Enter your email below to login to your account"}
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          {signup ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" name="firstName" placeholder="Max" autoComplete="given-name" required />
              <Field label="Last name" name="lastName" placeholder="Robinson" autoComplete="family-name" />
            </div>
          ) : null}

          <Field label="Email" name="email" type="email" placeholder="m@example.com" autoComplete="email" defaultValue={defaultEmail} required />

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={`${mode}-password`} className="text-sm font-medium">
                Password
              </label>
              {!signup ? (
                <Link href="/login/forgot" className="text-sm text-foreground underline underline-offset-2 hover:text-brand">
                  Forgot your password?
                </Link>
              ) : null}
            </div>
            <PasswordInput
              id={`${mode}-password`}
              name="password"
              placeholder={signup ? "Password" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          </div>

          {signup ? (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm Password"
                autoComplete="new-password"
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((value) => !value)}
              />
            </div>
          ) : (
            <label className="flex items-center gap-2 text-sm">
              <input name="rememberMe" type="checkbox" className="h-4 w-4 rounded-none border-border" />
              Remember me
            </label>
          )}

          {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-success">{state.success}</p> : null}

          <Button className="h-11 w-full rounded-none bg-[#1c1c1f] text-white hover:bg-[#111113]" disabled={pending}>
            {pending ? "Please wait" : signup ? "Create an account" : "Login"}
          </Button>
        </form>

        {!signup ? (
          <div className="mt-4 grid gap-2">
            <SocialButton provider="google" label="Sign in with Google" />
            <SocialButton provider="github" label="Sign in with GitHub" />
          </div>
        ) : null}

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          By {signup ? "signing up" : "signing in"}, you agree to the{" "}
          <LegalLink href="/terms">Terms of Use</LegalLink>, <LegalLink href="/privacy">Privacy Policy</LegalLink>, and{" "}
          <LegalLink href="/cookies">Cookies Policy</LegalLink>.
        </div>
      </div>
    </section>
  );
}

function AuthTab({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-10 min-w-24 items-center justify-center border border-border px-4 text-base",
        active ? "border-b-surface bg-surface font-semibold text-foreground" : "bg-surface-subtle text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        className="h-10 rounded-none bg-background shadow-sm"
      />
    </div>
  );
}

function PasswordInput({
  id,
  name,
  placeholder,
  autoComplete,
  visible,
  onToggle,
}: {
  id: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={8}
        required
        className="h-10 rounded-none bg-background pr-11 shadow-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SocialButton({ provider, label }: { provider: "google" | "github"; label: string }) {
  return (
    <form action={socialSignInAction}>
      <input type="hidden" name="provider" value={provider} />
      <Button className="h-9 w-full rounded-none border-border bg-background text-foreground shadow-sm hover:bg-surface-subtle" variant="secondary" type="submit">
        {provider === "google" ? <span className="text-base font-semibold text-brand">G</span> : <Github className="h-4 w-4" />}
        {label}
      </Button>
    </form>
  );
}

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="underline underline-offset-2 hover:text-foreground">
      {children}
    </Link>
  );
}
