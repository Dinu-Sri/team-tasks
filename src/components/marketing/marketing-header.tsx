import Image from "next/image";
import Link from "next/link";

import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Tuduvia home">
          <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={50} height={50} className="h-12 w-12 rounded-xl object-contain" priority />
        </Link>
        <nav className="hidden items-center gap-2 sm:flex" aria-label="Marketing navigation">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(buttonVariants({ variant: "ghost", size: "default" }), "font-medium text-sm")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeButton />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "default" }), "hidden sm:inline-flex font-medium text-sm")}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "default" }), "font-semibold")}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
