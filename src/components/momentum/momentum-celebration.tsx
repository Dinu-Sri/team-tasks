"use client";

import { Flame, ShieldCheck, Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { MomentumBadgeIcon } from "@/components/momentum/momentum-badge";
import type { MomentumAward } from "@/lib/momentum-shared";

export const MOMENTUM_CELEBRATION_EVENT = "team-tasks-momentum-celebration";

type CelebrationDetail = { momentum: MomentumAward | null; questCompleted: boolean };

export function MomentumCelebrationListener() {
  const [detail, setDetail] = useState<CelebrationDetail | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (event: Event) => {
      const next = (event as CustomEvent<CelebrationDetail>).detail;
      if (!next.momentum && !next.questCompleted) return;
      setDetail(next);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setDetail(null), next.momentum?.badgeUnlocked ? 4200 : 3000);
    };
    window.addEventListener(MOMENTUM_CELEBRATION_EVENT, show);
    return () => {
      window.removeEventListener(MOMENTUM_CELEBRATION_EVENT, show);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!detail) return null;
  const award = detail.momentum;

  return createPortal(
    <div className="momentum-celebration fixed inset-x-3 top-20 z-[100] mx-auto max-w-sm overflow-hidden rounded-lg border border-border bg-surface shadow-soft sm:left-auto sm:right-6 sm:mx-0 sm:w-96">
      <button type="button" onClick={() => setDetail(null)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle" aria-label="Close celebration">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-4 p-4 pr-11">
        {award?.badgeUnlocked ? (
          <MomentumBadgeIcon tier={award.badgeUnlocked} size="lg" className="momentum-badge-unlock h-16 w-16" />
        ) : detail.questCompleted ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Trophy className="h-7 w-7" /></span>
        ) : (
          <span className="momentum-flame flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Flame className="h-7 w-7 fill-current" /></span>
        )}
        <div className="min-w-0">
          <p className="text-base font-semibold">
            {award?.badgeUnlocked ? "New badge unlocked" : detail.questCompleted ? "Team Quest complete" : "Daily Win"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {award?.badgeUnlocked
              ? `${award.currentStreak}-day Momentum. Your badge is permanently saved.`
              : detail.questCompleted
                ? "Your team reached this week's shared goal."
                : `${award?.currentStreak ?? 0}-day Momentum. Nice and steady.`}
          </p>
          {award?.shieldsEarned ? <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-300"><ShieldCheck className="h-4 w-4" />Shield earned</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
