import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
};

export default withSentryConfig(nextConfig, {
  // Source maps are skipped without SENTRY_AUTH_TOKEN — still fully functional
  // for error monitoring. Stack traces will be minified until you add the token.
  silent: !process.env.CI,
});
