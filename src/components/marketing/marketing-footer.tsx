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
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-[1fr_1fr_1fr]">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <Link href="/" className="inline-flex shrink-0" aria-label="Tuduvia home">
            <Image src="/tuduvia-logo.webp" alt="Tuduvia" width={100} height={100} className="h-[100px] w-[100px] rounded-2xl object-contain" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">
            {siteConfig.tagline}
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteConfig.company}.
          </p>
        </div>
        <div className="text-center md:text-left">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Website</h2>
          <div className="mt-3 grid gap-2.5 text-sm">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </Link>
            ))}
            <Link href="/signup" className="text-brand font-semibold hover:underline">Start free</Link>
          </div>
        </div>
        <div className="text-center md:text-left">
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
