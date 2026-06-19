"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { ThemeButton } from "@/components/theme-button";
import { buttonVariants } from "@/components/ui/button";
import { marketingNav } from "@/lib/marketing/site";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:h-24">
        <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="Tuduvia home">
          <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={120} height={120} className="h-16 w-16 rounded-2xl object-contain sm:h-20 sm:w-20 lg:h-[120px] lg:w-[120px]" priority />
        </Link>
        {/* Desktop nav */}
        <nav className="hidden items-center gap-1.5 lg:flex xl:gap-2.5" aria-label="Marketing navigation">
          {marketingNav.map((item) => (
            <Link key={item.href} href={item.href} className={cn(buttonVariants({ variant: "ghost", size: "default" }), "font-bold uppercase tracking-[0.12em] text-xs xl:text-sm")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeButton />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "default" }), "hidden lg:inline-flex font-bold uppercase tracking-[0.12em] text-xs xl:text-sm")}>
            Sign in
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "default" }), "font-bold hidden lg:inline-flex")}>
            Start free
          </Link>
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="flex items-center justify-center h-10 w-10 rounded-full lg:hidden hover:bg-surface-subtle"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* Mobile slide-down menu */}
      {mobileOpen ? (
        <div className="border-t border-border/60 bg-surface px-5 pb-5 pt-3 lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile navigation">
            {marketingNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center h-11 rounded-lg px-4 text-sm font-bold uppercase tracking-[0.12em] text-foreground hover:bg-surface-subtle"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center h-11 rounded-lg px-4 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground hover:bg-surface-subtle"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="mt-2 flex items-center justify-center h-11 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground hover:bg-brand/90"
            >
              Start free
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
