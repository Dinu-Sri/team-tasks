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
    <footer className="border-t border-border bg-surface/70">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold" aria-label="Tuduvia home">
            <Image src="/tuduvia-logo.webp" alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-contain" />
            <span>{siteConfig.name}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            {siteConfig.tagline} A simple task app for personal life, temporary projects, and small teams.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Operated by {siteConfig.company}.</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Website</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {marketingNav.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
            <Link href="/signup" className="hover:text-foreground">Start free</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Legal</h2>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {legalLinks.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
