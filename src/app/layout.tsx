import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const themeBootstrapScript = `(() => {
  try {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = storedTheme === "dark" || (storedTheme !== "light" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
  } catch {
    // Ignore localStorage/matchMedia access issues and keep default theme.
  }
})();`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tuduvia.com"),
  title: {
    default: "Tuduvia - Simple to-do lists for personal life and small teams",
    template: "%s | Tuduvia",
  },
  description: "The simple way from to-do to done. Tuduvia is a simple task app for personal life, temporary projects, and small teams. No Boards. No Training.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Tuduvia - The simple way from to-do to done",
    description: "A simple task app for personal life, temporary projects, and small teams. No Boards. No Training.",
    url: "/",
    siteName: "Tuduvia",
    images: [{ url: "/tuduvia-logo.webp", width: 512, height: 512, alt: "Tuduvia" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tuduvia - The simple way from to-do to done",
    description: "A simple task app for personal life, temporary projects, and small teams. No Boards. No Training.",
    images: ["/tuduvia-logo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="theme-bootstrap" dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
