"use client";

import { Eye, EyeOff, Github } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useActionState, useState } from "react";

import { resendVerificationAction, socialSignInAction, type AuthState } from "@/app/actions/auth";
import { AuthLogo } from "@/components/auth/auth-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthAction = (state: AuthState, formData: FormData) => Promise<AuthState>;

export function AuthForm({
  mode,
  action,
  defaultEmail,
  notice,
  onModeChange,
  showLogo = true,
}: {
  mode: "login" | "signup";
  action: AuthAction;
  defaultEmail?: string;
  notice?: string;
  onModeChange?: (mode: "login" | "signup") => void;
  showLogo?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationAction, {});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const signup = mode === "signup";
  const unverifiedEmail = !signup ? state.unverifiedEmail : undefined;

  return (
    <section className="w-full max-w-[448px]">
      {showLogo ? (
        <div className="text-center">
          <AuthLogo />
        </div>
      ) : null}
      <div className="mb-4 flex rounded-full border border-border bg-surface p-1 shadow-sm">
        <AuthTab href="/login" active={!signup} onSelect={onModeChange ? () => onModeChange("login") : undefined}>
          Sign In
        </AuthTab>
        <AuthTab href="/login?mode=signup" active={signup} onSelect={onModeChange ? () => onModeChange("signup") : undefined}>
          Sign Up
        </AuthTab>
      </div>

      <div className="rounded-lg border border-border bg-surface px-6 py-7 shadow-soft sm:px-7">
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
          {notice ? <p className="text-sm text-success">{notice}</p> : null}
          {state.success ? <p className="text-sm text-success">{state.success}</p> : null}

          <Button className="h-11 w-full" disabled={pending}>
            {pending ? "Please wait" : signup ? "Create an account" : "Login"}
          </Button>
        </form>

        {unverifiedEmail ? (
          <form action={resendAction} className="mt-3 rounded-lg border border-border bg-surface-subtle p-3 text-sm">
            <input type="hidden" name="email" value={unverifiedEmail} />
            <p className="text-muted-foreground">Did not get the verification email?</p>
            {resendState.error ? <p className="mt-2 text-xs text-danger">{resendState.error}</p> : null}
            {resendState.success ? <p className="mt-2 text-xs text-success">{resendState.success}</p> : null}
            <Button type="submit" className="mt-3 w-full" size="sm" variant="secondary" disabled={resendPending}>
              {resendPending ? "Sending" : "Send verification email again"}
            </Button>
          </form>
        ) : null}

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

function AuthTab({ href, active, children, onSelect }: { href: string; active: boolean; children: ReactNode; onSelect?: () => void }) {
  const className = cn(
    "flex h-10 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors",
    active ? "bg-brand text-brand-foreground shadow-sm" : "text-muted-foreground hover:bg-surface-subtle hover:text-foreground",
  );
  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} className={className}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
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
        className="h-11 bg-background shadow-sm"
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
        className="h-11 bg-background pr-11 shadow-sm"
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
  async function action(formData: FormData) {
    await socialSignInAction(formData);
  }

  return (
    <form action={action}>
      <input type="hidden" name="provider" value={provider} />
      <Button className="h-10 w-full border-border bg-background text-foreground shadow-sm hover:bg-surface-subtle" variant="secondary" type="submit">
        {provider === "google" ? <GoogleLogo /> : <Github className="h-4 w-4" />}
        {label}
      </Button>
    </form>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5c-.2 1.2-.9 2.2-2 2.9v2.4h3.2c1.9-1.7 3.1-4.2 3.1-7Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.7-2.5l-3.2-2.4c-.9.6-2 1-3.5 1-2.7 0-4.9-1.8-5.7-4.2H3v2.5C4.7 19.7 8.1 22 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.6H3A10 10 0 0 0 3 16.4l3.3-2.5Z" />
      <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2 8.1 2 4.7 4.3 3 7.6l3.3 2.5C7.1 7.7 9.3 5.9 12 5.9Z" />
    </svg>
  );
}

function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="underline underline-offset-2 hover:text-foreground">
      {children}
    </Link>
  );
}
