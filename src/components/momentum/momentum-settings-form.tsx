"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { updateMomentumSettingsAction } from "@/app/actions/momentum";
import { Button } from "@/components/ui/button";

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Colombo",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function MomentumSettingsForm({
  enabled,
  timeZone,
  workDays,
  reminderHour,
  remindersEnabled,
}: {
  enabled: boolean;
  timeZone: string;
  workDays: number[];
  reminderHour: number;
  remindersEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(updateMomentumSettingsAction, {});
  const timezones = COMMON_TIMEZONES.includes(timeZone) ? COMMON_TIMEZONES : [timeZone, ...COMMON_TIMEZONES];

  return (
    <form action={action} className="space-y-5">
      <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg bg-surface-subtle px-3 py-2.5 text-sm">
        <span>
          <span className="block font-medium">Momentum enabled</span>
          <span className="block text-xs text-muted-foreground">Pause without losing badges or history.</span>
        </span>
        <input name="enabled" type="checkbox" defaultChecked={enabled} className="h-5 w-5 accent-[hsl(var(--brand))]" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Timezone</span>
          <select name="timeZone" defaultValue={timeZone} className="h-11 w-full rounded-full border border-border bg-surface px-3 text-sm">
            {timezones.map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Reminder time</span>
          <select name="reminderHour" defaultValue={reminderHour} className="h-11 w-full rounded-full border border-border bg-surface px-3 text-sm">
            {Array.from({ length: 13 }, (_, index) => index + 8).map((hour) => (
              <option key={hour} value={hour}>{new Intl.DateTimeFormat("en", { hour: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 1, hour)))}</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Workdays</legend>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {DAY_OPTIONS.map((day) => (
            <label key={day.value} className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-2 text-xs font-medium has-[:checked]:border-brand has-[:checked]:bg-brand/10 has-[:checked]:text-brand">
              <input className="sr-only" type="checkbox" name="workDays" value={day.value} defaultChecked={workDays.includes(day.value)} />
              {day.label}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex min-h-11 items-center justify-between gap-4 rounded-lg bg-surface-subtle px-3 py-2.5 text-sm">
        <span>
          <span className="block font-medium">Gentle reminder</span>
          <span className="block text-xs text-muted-foreground">At most one reminder on an eligible day.</span>
        </span>
        <input name="remindersEnabled" type="checkbox" defaultChecked={remindersEnabled} className="h-5 w-5 accent-[hsl(var(--brand))]" />
      </label>

      <div className="flex flex-col-reverse gap-2 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <p className={`text-xs ${state.error ? "text-danger" : "text-success"}`}>{state.error ?? state.success ?? ""}</p>
        <Button type="submit" disabled={pending}><Save />{pending ? "Saving" : "Save settings"}</Button>
      </div>
    </form>
  );
}
