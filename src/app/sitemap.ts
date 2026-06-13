import type { MetadataRoute } from "next";

import { publicMarketingRoutes, siteConfig } from "@/lib/marketing/site";
import { useCases } from "@/lib/marketing/use-cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...publicMarketingRoutes.map((route) => ({
      url: new URL(route.path, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...useCases.map((useCase) => ({
      url: new URL(`/use-cases/${useCase.slug}`, siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: useCase.priority === "high" ? 0.8 : 0.65,
    })),
  ];
}
