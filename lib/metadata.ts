import type { Metadata } from "next";

const baseUrl = "https://i79.ai";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "i79.ai – AI Consulting & Intelligent Systems",
    template: "%s – i79.ai",
  },
  description:
    "i79.ai builds enterprise AI platforms, intelligent automation systems, and AI-powered recruitment software that help organizations scale smarter.",
  keywords: [
    "AI consulting",
    "enterprise AI",
    "AI recruitment platform",
    "AI hiring software",
    "AI ATS",
    "intelligent automation",
    "AI strategy",
    "AI system development",
    "automated AI interviews",
    "candidate scoring software",
    "machine learning consulting",
    "AI transformation",
    "enterprise automation",
    "AI-powered recruitment",
  ],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "i79.ai",
    title: "i79.ai – AI Consulting & Intelligent Systems",
    description:
      "Enterprise AI platforms, intelligent automation, and AI-powered recruitment systems built for scale.",
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "i79.ai – AI Consulting & Intelligent Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "i79.ai – AI Consulting & Intelligent Systems",
    description:
      "Enterprise AI platforms, intelligent automation, and AI-powered recruitment systems built for scale.",
    images: [`${baseUrl}/og-image.svg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

type BuildMetadataOptions = {
  canonicalPath?: string;
  extraKeywords?: string[];
};

export function buildMetadata(
  overrides: Partial<Metadata>,
  options: BuildMetadataOptions = {}
): Metadata {
  const { canonicalPath, extraKeywords } = options;
  const { openGraph, twitter, ...rest } = overrides;

  return {
    ...defaultMetadata,
    ...rest,
    ...(extraKeywords?.length
      ? { keywords: [...(defaultMetadata.keywords as string[]), ...extraKeywords] }
      : {}),
    ...(canonicalPath
      ? { alternates: { canonical: `${baseUrl}${canonicalPath}` } }
      : {}),
    openGraph: {
      ...(defaultMetadata.openGraph as object),
      ...((openGraph as object) ?? {}),
    },
    twitter: {
      ...(defaultMetadata.twitter as object),
      ...((twitter as object) ?? {}),
    },
  };
}
