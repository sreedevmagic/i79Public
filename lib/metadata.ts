import type { Metadata } from "next";

const baseUrl = "https://i79.ai";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "i79 Engage – AI Hiring Platform",
    template: "%s | i79.ai",
  },
  description:
    "i79 Engage is an AI hiring platform that automates candidate screening, AI interviews, and hiring decisions — end to end. Used by enterprise hiring teams.",
  keywords: [
    "AI hiring platform",
    "AI recruitment platform",
    "automated candidate screening",
    "AI interview software",
    "AI applicant tracking system",
    "candidate scoring software",
    "hiring automation",
    "AI hiring pipeline",
    "structured AI interviews",
    "enterprise recruiting software",
    "recruitment automation",
    "AI shortlisting",
    "decision packs hiring",
    "AI sourcing tool",
    "i79 Engage",
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
    title: "i79 Engage – AI Hiring Platform",
    description:
      "Automate your entire hiring pipeline — candidate screening, AI interviews, ranked shortlists, and decision packs. Built for enterprise hiring teams.",
    images: [
      {
        url: `${baseUrl}/og-image.svg`,
        width: 1200,
        height: 630,
        alt: "i79 Engage – AI Hiring Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "i79 Engage – AI Hiring Platform",
    description:
      "Automate your entire hiring pipeline — candidate screening, AI interviews, ranked shortlists, and decision packs. Built for enterprise hiring teams.",
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
