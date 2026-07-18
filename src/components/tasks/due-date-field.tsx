"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function localTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DueDateField({
  name,
  defaultValue = "today",
  value,
  onChange,
  emptyLabel,
  selectClassName,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  emptyLabel?: string;
  selectClassName?: string;
}) {
  const controlled = value !== undefined;
  const initial = controlled ? value : defaultValue;
  const [preset, setPreset] = useState(() => (isDateKey(initial) ? "custom" : initial || (emptyLabel ? "" : "today")));
  const [customDate, setCustomDate] = useState(() => (isDateKey(initial) ? initial : localTodayKey()));

  useEffect(() => {
    if (!controlled) return;
    if (isDateKey(value)) {
      setPreset("custom");
      setCustomDate(value);
      return;
    }
    setPreset(value || (emptyLabel ? "" : "today"));
  }, [controlled, emptyLabel, value]);

  const dueValue = preset === "custom" ? customDate : preset;

  function emit(next: string) {
    onChange?.(next);
  }

  function handlePresetChange(next: string) {
    if (next === "custom") {
      const date = customDate || localTodayKey();
      setPreset("custom");
      setCustomDate(date);
      emit(date);
      return;
    }
    setPreset(next);
    emit(next);
  }

  function handleCustomDateChange(next: string) {
    setCustomDate(next);
    setPreset("custom");
    emit(next);
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center">
      {name ? <input type="hidden" name={name} value={dueValue} /> : null}
      <select
        value={preset}
        onChange={(event) => handlePresetChange(event.target.value)}
        className={cn("h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm", selectClassName)}
        aria-label="Due date"
      >
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        <option value="today">Today</option>
        <option value="tomorrow">Tomorrow</option>
        <option value="week">Next week</option>
        <option value="none">No date</option>
        <option value="custom">Custom date</option>
      </select>
      {preset === "custom" ? (
        <input
          type="date"
          value={customDate}
          onChange={(event) => handleCustomDateChange(event.target.value)}
          className={cn("h-11 min-w-0 rounded-full border border-border bg-surface px-3 text-sm", selectClassName)}
          aria-label="Custom due date"
          required={Boolean(name)}
        />
      ) : null}
    </div>
  );
}
