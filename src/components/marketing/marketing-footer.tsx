import Image from "next/image";
import Link from "next/link";

import { marketingNav, siteConfig } from "@/lib/marketing/site";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
  { href: "/llms.txt", label: "llms.txt" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/80">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 shrink-0" aria-label="Tuduvia home">
            <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl object-contain" />
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
            {siteConfig.tagline} Simple task app for personal life, temporary projects, and small teams.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.company}.
          </p>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Website</h2>
          <div className="mt-3 grid gap-2.5 text-sm">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
            <Link href="/signup" className="text-brand font-medium hover:underline">Start free</Link>
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Legal</h2>
          <div className="mt-3 grid gap-2.5 text-sm">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
