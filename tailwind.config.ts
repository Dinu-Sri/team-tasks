import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
    "./node_modules/onborda/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface) / <alpha-value>)",
        "surface-subtle": "hsl(var(--surface-subtle) / <alpha-value>)",
        brand: "hsl(var(--brand) / <alpha-value>)",
        "brand-foreground": "hsl(var(--brand-foreground))",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      boxShadow: {
        soft: "0 24px 70px -42px hsl(var(--foreground) / 0.38)",
        hairline: "0 1px 0 hsl(var(--border) / 0.72)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
