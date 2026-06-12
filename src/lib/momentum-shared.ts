export const BADGE_DEFINITIONS = [
  { tier: "SPARK", name: "Spark", streak: 1, description: "The habit has started." },
  { tier: "RHYTHM", name: "Rhythm", streak: 3, description: "A repeatable rhythm." },
  { tier: "FLOW", name: "Flow", streak: 7, description: "One consistent work cycle." },
  { tier: "DRIVE", name: "Drive", streak: 14, description: "Consistency beyond novelty." },
  { tier: "PEAK", name: "Peak", streak: 30, description: "A durable working habit." },
  { tier: "LEGACY", name: "Legacy", streak: 100, description: "Long-term reliability." },
] as const;

export type MomentumBadgeTier = (typeof BADGE_DEFINITIONS)[number]["tier"];
export type MomentumDayState = "PENDING" | "WIN" | "SHIELDED" | "MISSED" | "NEUTRAL";

export type MomentumAward = {
  dailyWin: boolean;
  currentStreak: number;
  badgeUnlocked: MomentumBadgeTier | null;
  shieldsEarned: number;
  shieldCount: number;
};

export type MomentumSummary = {
  enabled: boolean;
  currentStreak: number;
  longestStreak: number;
  totalWins: number;
  shieldCount: number;
  currentBadge: MomentumBadgeTier | null;
  nextBadge: { tier: MomentumBadgeTier; name: string; streak: number; winsNeeded: number } | null;
  todayStatus: MomentumDayState;
  timeZone: string;
  workDays: number[];
  reminderHour: number;
  remindersEnabled: boolean;
  recentDays: Array<{ date: string; status: MomentumDayState }>;
  achievements: Array<{ badge: MomentumBadgeTier; unlockedAt: string }>;
  quests: Array<{
    id: string;
    teamName: string;
    title: string;
    progress: number;
    target: number;
    status: "ACTIVE" | "COMPLETED" | "EXPIRED";
    endAt: string;
  }>;
};
