import Image from "next/image";
import Link from "next/link";

import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-15 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Tuduvia home">
          <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={32} height={32} className="h-8 w-8 rounded-lg object-contain" priority />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing navigation">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-medium")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeButton />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex font-medium")}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "font-semibold")}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
