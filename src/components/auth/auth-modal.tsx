"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { loginAction, signupAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup";

export function AuthModal({
  open,
  initialMode = "login",
  onClose,
}: {
  open: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [initialMode, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm sm:py-10" role="dialog" aria-modal="true" aria-label={mode === "signup" ? "Sign up" : "Sign in"}>
      <div className="relative w-full max-w-[480px] rounded-xl bg-background p-3 shadow-soft sm:max-h-[calc(100svh-3rem)] sm:overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground"
          aria-label="Close sign in dialog"
        >
          <X className="h-4 w-4" />
        </button>
        <AuthForm key={mode} mode={mode} action={mode === "signup" ? signupAction : loginAction} onModeChange={setMode} showLogo={false} />
      </div>
    </div>,
    document.body,
  );
}

export function AuthModalButton({
  mode = "signup",
  className,
  children,
  onOpen,
}: {
  mode?: AuthMode;
  className?: string;
  children: ReactNode;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        className={cn(className)}
      >
        {children}
      </button>
      <AuthModal open={open} initialMode={mode} onClose={() => setOpen(false)} />
    </>
  );
}
