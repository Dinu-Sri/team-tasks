import { Award, ChartNoAxesColumnIncreasing, Mountain, Sparkles, Waves, Zap } from "lucide-react";

import type { MomentumBadgeTier } from "@/lib/momentum-shared";
import { cn } from "@/lib/utils";

const badgeStyles: Record<MomentumBadgeTier, { icon: typeof Sparkles; className: string }> = {
  SPARK: { icon: Sparkles, className: "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  RHYTHM: { icon: ChartNoAxesColumnIncreasing, className: "border-cyan-300 bg-cyan-100 text-cyan-700 dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-300" },
  FLOW: { icon: Waves, className: "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  DRIVE: { icon: Zap, className: "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  PEAK: { icon: Mountain, className: "border-indigo-300 bg-indigo-100 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" },
  LEGACY: { icon: Award, className: "border-yellow-400 bg-yellow-100 text-yellow-800 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-300" },
};

export function MomentumBadgeIcon({
  tier,
  size = "md",
  dormant = false,
  className,
}: {
  tier: MomentumBadgeTier;
  size?: "sm" | "md" | "lg";
  dormant?: boolean;
  className?: string;
}) {
  const config = badgeStyles[tier];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full border shadow-hairline",
        size === "sm" && "h-8 w-8",
        size === "md" && "h-11 w-11",
        size === "lg" && "h-20 w-20 border-2",
        config.className,
        dormant && "grayscale opacity-45 shadow-none",
        className,
      )}
    >
      <Icon className={cn(size === "sm" && "h-4 w-4", size === "md" && "h-5 w-5", size === "lg" && "h-9 w-9")} />
      {!dormant ? <span className="absolute inset-x-2 top-1 h-px rounded-full bg-white/70" /> : null}
    </span>
  );
}
