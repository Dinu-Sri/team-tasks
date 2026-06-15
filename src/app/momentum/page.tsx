import { Check, Flame, ShieldCheck, Sparkles, Trophy } from "lucide-react";

import { AppHeader } from "@/components/app-header";
import { MomentumBadgeIcon } from "@/components/momentum/momentum-badge";
import { MomentumSettingsForm } from "@/components/momentum/momentum-settings-form";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { getHeaderData } from "@/lib/header-data";
import { BADGE_DEFINITIONS } from "@/lib/momentum-shared";

function dayLabel(date: string) {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}

function statusLabel(status: string) {
  if (status === "WIN") return "Daily Win";
  if (status === "SHIELDED") return "Shielded";
  if (status === "MISSED") return "Missed";
  if (status === "PENDING") return "Ready";
  return "Neutral";
}

export default async function MomentumPage() {
  const user = await requireUser();
  const headerData = await getHeaderData(user.id);
  const momentum = headerData.momentum;
  const achievementSet = new Set(momentum.achievements.map(({ badge }) => badge));
  const activeDefinition = BADGE_DEFINITIONS.find((badge) => badge.tier === momentum.currentBadge);

  return (
    <main className="min-h-screen bg-background">
      <AppHeader user={user} {...headerData} />
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
        <section className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {momentum.currentBadge ? <MomentumBadgeIcon tier={momentum.currentBadge} size="lg" /> : <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-surface-subtle text-muted-foreground"><Sparkles className="h-8 w-8" /></span>}
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Your Momentum</p>
              <h1 className="mt-0.5 text-3xl font-semibold">{momentum.currentStreak} day{momentum.currentStreak === 1 ? "" : "s"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{activeDefinition?.name ?? "Finish one task on a workday to begin."}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-80">
            <div className="rounded-lg bg-surface-subtle px-3 py-3 text-center"><strong className="block text-lg">{momentum.longestStreak}</strong><span className="text-xs text-muted-foreground">Best</span></div>
            <div className="rounded-lg bg-surface-subtle px-3 py-3 text-center"><strong className="block text-lg">{momentum.totalWins}</strong><span className="text-xs text-muted-foreground">Wins</span></div>
            <div className="rounded-lg bg-surface-subtle px-3 py-3 text-center"><strong className="block text-lg">{momentum.shieldCount}</strong><span className="text-xs text-muted-foreground">Shields</span></div>
          </div>
        </section>

        <section className="border-b border-border py-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">This week</h2>
              <p className="mt-1 text-sm text-muted-foreground">One useful completion is enough for a Daily Win.</p>
            </div>
            <Badge variant={momentum.todayStatus === "WIN" ? "success" : momentum.todayStatus === "PENDING" ? "warning" : "secondary"}>{statusLabel(momentum.todayStatus)}</Badge>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-3">
            {momentum.recentDays.map((day) => (
              <div key={day.date} className="min-w-0 text-center">
                <div className={`mx-auto flex aspect-square max-w-14 items-center justify-center rounded-full border text-sm font-semibold ${
                  day.status === "WIN" ? "border-success bg-success text-white" :
                  day.status === "SHIELDED" ? "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                  day.status === "MISSED" ? "border-danger/30 bg-danger/10 text-danger" :
                  day.status === "PENDING" ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                  "border-border bg-surface text-muted-foreground"
                }`}>
                  {day.status === "WIN" ? <Check className="h-5 w-5" /> : day.status === "SHIELDED" ? <ShieldCheck className="h-5 w-5" /> : day.status === "PENDING" ? <Flame className="h-5 w-5" /> : null}
                </div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground sm:text-xs">{dayLabel(day.date).split(",")[0]}</p>
              </div>
            ))}
          </div>
          {momentum.nextBadge ? (
            <div className="mt-5">
              <div className="flex justify-between gap-3 text-xs"><span>{momentum.nextBadge.winsNeeded} more Daily Win{momentum.nextBadge.winsNeeded === 1 ? "" : "s"} to {momentum.nextBadge.name}</span><span className="text-muted-foreground">{momentum.currentStreak}/{momentum.nextBadge.streak}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (momentum.currentStreak / momentum.nextBadge.streak) * 100)}%` }} /></div>
            </div>
          ) : null}
        </section>

        <section className="border-b border-border py-6">
          <h2 className="text-lg font-semibold">Badge path</h2>
          <p className="mt-1 text-sm text-muted-foreground">Earned badges remain yours even when an active streak resets.</p>
          <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {BADGE_DEFINITIONS.map((badge) => {
              const earned = achievementSet.has(badge.tier);
              const active = momentum.currentBadge === badge.tier;
              return (
                <div key={badge.tier} className={`flex items-center gap-3 rounded-lg border p-3 ${active ? "border-brand bg-brand/5" : "border-border bg-surface"}`}>
                  <MomentumBadgeIcon tier={badge.tier} size="md" dormant={!earned} />
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{badge.name}</p><p className="text-xs text-muted-foreground">{badge.streak} day{badge.streak === 1 ? "" : "s"}</p></div>
                  {earned ? <Check className="h-4 w-4 text-success" /> : <span className="text-xs text-muted-foreground">Locked</span>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-b border-border py-6">
          <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-600 dark:text-amber-300" /><h2 className="text-lg font-semibold">Team Quests</h2></div>
          <p className="mt-1 text-sm text-muted-foreground">Shared weekly goals. No employee leaderboard.</p>
          {momentum.quests.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {momentum.quests.map((quest) => (
                <div key={quest.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{quest.teamName}</p><p className="mt-0.5 text-xs text-muted-foreground">{quest.title}</p></div>{quest.status === "COMPLETED" ? <Badge variant="success">Complete</Badge> : null}</div>
                  <div className="mt-4 flex items-center justify-between text-xs"><span>{quest.progress} of {quest.target} Daily Wins</span><span className="text-muted-foreground">Team total</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 rounded-lg border border-border bg-surface px-4 py-8 text-center text-sm text-muted-foreground">Your first team quest will appear automatically.</p>}
        </section>

        <details className="group py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Preferences</h2><p className="mt-1 text-sm text-muted-foreground">Workdays, timezone and gentle reminders.</p></div><span className="text-sm text-muted-foreground group-open:hidden">Show</span><span className="hidden text-sm text-muted-foreground group-open:inline">Hide</span></summary>
          <div className="mt-5 rounded-lg border border-border bg-surface p-4 sm:p-5">
            <MomentumSettingsForm enabled={momentum.enabled} timeZone={momentum.timeZone} workDays={momentum.workDays} reminderHour={momentum.reminderHour} remindersEnabled={momentum.remindersEnabled} />
          </div>
        </details>
      </div>
    </main>
  );
}
