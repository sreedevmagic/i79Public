import type { Metadata } from "next";

const baseUrl = "https://i79.ai";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "i79.ai | AI Consulting & Intelligent Systems",
    template: "%s | i79.ai",
  },
  description:
    "i79.ai is an AI consulting company building enterprise AI platforms, intelligent automation, and AI-powered recruitment systems.",
  keywords: [
    "AI consulting UAE",
    "AI recruitment platform",
    "AI ATS",
    "AI hiring software",
    "enterprise AI",
    "intelligent automation",
    "AI strategy",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "i79.ai",
    title: "i79.ai | AI Consulting & Intelligent Systems",
    description:
      "AI consulting company building enterprise AI platforms and recruitment systems.",
    images: [
      {
        url: `${baseUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "i79.ai – AI Consulting & Intelligent Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "i79.ai | AI Consulting & Intelligent Systems",
    description:
      "AI consulting company building enterprise AI platforms and recruitment systems.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export function buildMetadata(overrides: Partial<Metadata>): Metadata {
  return {
    ...defaultMetadata,
    ...overrides,
  };
}
