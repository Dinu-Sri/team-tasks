import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/marketing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/analytics", "/invite/", "/*?task="],
    },
    sitemap: new URL("/sitemap.xml", siteConfig.url).toString(),
  };
}
