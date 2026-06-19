import type { Metadata } from "next";

import { siteConfig } from "@/lib/marketing/site";

const logoUrl = absoluteUrl("/tuduvia-logo.webp");

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title: title.includes("Tuduvia") ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: title.includes("Tuduvia") ? title : `${title} | Tuduvia`,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: logoUrl, width: 512, height: 512, alt: siteConfig.name }],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: title.includes("Tuduvia") ? title : `${title} | Tuduvia`,
      description,
      images: [logoUrl],
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.company,
    url: siteConfig.url,
    logo: logoUrl,
    email: siteConfig.supportEmail,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: siteConfig.supportEmail,
        url: absoluteUrl("/contact"),
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteConfig.url}/#software`,
    name: siteConfig.name,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    description: siteConfig.description,
    image: logoUrl,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    offers: {
      "@type": "Offer",
      name: "Tuduvia Free Plan",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      category: "Productivity software",
      url: absoluteUrl("/pricing"),
    },
  };
}

export function webPageSchema({ path, name, description }: { path: string; name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": `${siteConfig.url}/#website` },
  };
}

export function collectionPageSchema({ path, name, description }: { path: string; name: string; description: string }) {
  return {
    ...webPageSchema({ path, name, description }),
    "@type": "CollectionPage",
  };
}

export function contactPageSchema({ path, name, description }: { path: string; name: string; description: string }) {
  return {
    ...webPageSchema({ path, name, description }),
    "@type": "ContactPage",
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faq: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function itemListSchema(items: Array<{ name: string; path: string; description?: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.path),
      name: item.name,
      description: item.description,
    })),
  };
}

export function freePlanOfferSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: "Tuduvia Free Plan",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    category: "Productivity software",
    url: absoluteUrl("/pricing"),
    itemOffered: { "@id": `${siteConfig.url}/#software` },
    priceSpecification: {
      "@type": "PriceSpecification",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
