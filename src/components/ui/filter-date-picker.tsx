"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { filterControlClass } from "@/components/ui/filter-controls";
import { cn } from "@/lib/utils";

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(a: Date | null, b: Date) {
  return Boolean(a && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate());
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function displayDate(value: string) {
  const date = parseDateValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function FilterDatePicker({
  value,
  onChange,
  ariaLabel,
  placeholder,
  align = "left",
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  align?: "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const selectedDate = parseDateValue(value);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => selectedDate ?? new Date());

  useEffect(() => {
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [value]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const days = useMemo(() => {
    const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const startOffset = first.getDay();
    return Array.from({ length: 42 }, (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - startOffset + 1));
  }, [visibleMonth]);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function selectDate(date: Date) {
    onChange(toDateValue(date));
    setOpen(false);
  }

  function selectToday() {
    const today = new Date();
    onChange(toDateValue(today));
    setVisibleMonth(today);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(filterControlClass, "flex items-center justify-between gap-3 text-left")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={cn("min-w-0 truncate", !value && "text-muted-foreground")}>{displayDate(value) || placeholder}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-40 mt-1 w-[min(19rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 shadow-soft",
            align === "right" ? "right-0" : "left-0",
          )}
          role="dialog"
          aria-label={ariaLabel}
        >
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={() => moveMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold">{monthTitle(visibleMonth)}</p>
            <button type="button" onClick={() => moveMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle hover:text-foreground" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[0.7rem] font-medium uppercase text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.getMonth() === visibleMonth.getMonth();
              const selected = sameDay(selectedDate, day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                    inMonth ? "text-foreground hover:bg-surface-subtle" : "text-muted-foreground/45 hover:bg-surface-subtle",
                    selected && "bg-brand text-brand-foreground hover:bg-brand",
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface-subtle hover:text-foreground">Clear</button>
            <button type="button" onClick={selectToday} className="rounded-full bg-brand px-3 py-1.5 text-sm font-medium text-brand-foreground hover:bg-brand/90">Today</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
