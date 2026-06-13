"use client";

import { useActionState } from "react";

import { contactAction } from "@/app/actions/contact";
import type { ContactState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const topics = ["Product support", "Business or partnership", "Legal or privacy", "Bug or security report", "Feedback or idea"];

export function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(contactAction, {});

  return (
    <form action={formAction} className="grid gap-4 rounded-lg border border-border bg-surface/75 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Name
          <Input name="name" autoComplete="name" required placeholder="Your name" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Organization
        <Input name="organization" autoComplete="organization" placeholder="Optional" />
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Topic
        <select name="topic" className="h-11 rounded-full border border-border bg-surface/85 px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {topics.map((topic) => <option key={topic}>{topic}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-medium">
        Message
        <textarea
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Tell us what you need help with."
          className="min-h-36 rounded-lg border border-border bg-surface/85 px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <Button size="lg" disabled={pending}>{pending ? "Sending" : "Send message"}</Button>
    </form>
  );
}
