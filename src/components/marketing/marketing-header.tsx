import Image from "next/image";
import Link from "next/link";

import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav, siteConfig } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold" aria-label="Tuduvia home">
          <Image src="/tuduvia-logo.webp" alt="" width={34} height={34} className="h-8 w-8 rounded-lg object-contain" priority />
          <span>{siteConfig.name}</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Marketing navigation">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(buttonVariants({ variant: "quiet", size: "sm" }))}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeButton />
          <Link href="/login" className={cn(buttonVariants({ variant: "quiet", size: "sm" }), "hidden sm:inline-flex")}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }))}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
