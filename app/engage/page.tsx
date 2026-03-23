import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import JsonLd from "@/components/layout/JsonLd";
import EngageHero from "@/components/engage/EngageHero";
import Features from "@/components/engage/Features";
import AIInterview from "@/components/engage/AIInterview";
import HowItWorks from "@/components/engage/HowItWorks";
import EngageCTA from "@/components/engage/EngageCTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "i79 Engage – AI Recruitment Platform",
    description:
      "i79 Engage is a full-cycle AI recruitment platform — AI video interviews, structured scorecards, ATS pipeline, branded career pages, SSO, and HRIS integrations for enterprise teams.",
    openGraph: {
      title: "i79 Engage – AI Recruitment Platform",
      description:
        "Automate interviews, score candidates with AI, and hire smarter. i79 Engage is the full-cycle intelligent recruitment platform for modern enterprises.",
    },
  },
  {
    canonicalPath: "/engage",
    extraKeywords: [
      "AI video interviews",
      "AI interview platform",
      "structured AI scorecards",
      "recruitment automation",
      "AI applicant tracking system",
      "enterprise recruiting software",
      "SSO recruitment platform",
      "HRIS integration ATS",
      "automated candidate screening",
    ],
  }
);

const engageSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "i79 Engage",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Full-cycle AI recruitment platform with automated video interviews, structured AI scorecards, candidate scoring, ATS pipeline, branded career pages, SSO, and HRIS integrations.",
  url: "https://i79.ai/engage",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial available — no credit card required",
  },
  featureList: [
    "AI video interviews",
    "Structured AI scorecards",
    "Applicant tracking system",
    "Branded career page",
    "SSO authentication",
    "HRIS & ATS integrations",
    "Candidate scoring & ranking",
    "Hiring analytics",
    "Bias-free evaluation engine",
    "Fraud detection",
  ],
};

export default function EngagePage() {
  return (
    <>
      <JsonLd schema={engageSchema} />
      <EngageHero />
      <Features />
      <AIInterview />
      <HowItWorks />
      <EngageCTA />
    </>
  );
}
