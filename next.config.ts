import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg"],
  typescript: {
    // Docker build uses npm which may not resolve all types from pnpm structure
    ignoreBuildErrors: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "clossyan-technologies-pvt-ltd",
  project: "team-task",
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
