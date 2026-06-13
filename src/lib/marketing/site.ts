export const siteConfig = {
  name: "Tuduvia",
  tagline: "The simple way from to-do to done.",
  description: "A damn simple to-do list for personal life, temporary projects, and small teams that do not need boards or training.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuduvia.com",
  company: "Clossyan Technologies Pvt Ltd",
  supportEmail: "support@tuduvia.com",
  legalEmail: "legal@tuduvia.com",
  privacyEmail: "privacy@tuduvia.com",
};

export const marketingNav = [
  { href: "/use-cases", label: "Use cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export const publicMarketingRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/use-cases", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/cookies", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" as const },
  { path: "/signup", priority: 0.7, changeFrequency: "monthly" as const },
];
