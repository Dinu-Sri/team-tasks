import { cn } from "@/lib/utils";

type AvatarProps = {
  initials: string;
  label: string;
  image?: string | null;
  tone?: string;
  className?: string;
};

export function Avatar({ initials, label, image, tone = "bg-brand/15 text-brand", className }: AvatarProps) {
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
      {image ? <img src={image} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" /> : initials}
    </span>
  );
}
