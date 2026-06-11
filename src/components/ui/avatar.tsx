import { cn } from "@/lib/utils";

type AvatarProps = {
  initials: string;
  label: string;
  tone?: string;
  className?: string;
};

export function Avatar({ initials, label, tone = "bg-brand/15 text-brand", className }: AvatarProps) {
  return (
    <span
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-surface",
        tone,
        className,
      )}
    >
      {initials}
    </span>
  );
}
