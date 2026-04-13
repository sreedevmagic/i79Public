import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import JsonLd from "@/components/layout/JsonLd";
import EngageHero from "@/components/engage/EngageHero";
import EngageDemo from "@/components/engage/EngageDemo";
import PipelineVisual from "@/components/engage/PipelineVisual";
import EngageWorkflow from "@/components/engage/EngageWorkflow";
import Features from "@/components/engage/Features";
import AIInterview from "@/components/engage/AIInterview";
import Integrations from "@/components/engage/Integrations";
import EngageCTA from "@/components/engage/EngageCTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "i79 Engage – AI Hiring Platform",
    description:
      "i79 Engage is a full-cycle AI hiring platform — automated CV scoring, structured AI interviews, ranked shortlists, and decision packs for enterprise hiring teams.",
    openGraph: {
      title: "i79 Engage – AI Hiring Platform",
      description:
        "Automate your entire hiring pipeline — from CV scoring to final decision. i79 Engage is the full-cycle intelligent recruitment platform for modern enterprises.",
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
    "Full-cycle AI hiring platform with automated CV scoring, structured AI interviews, ranked shortlists, decision packs, branded career pages, AI sourcing, and enterprise integrations.",
  url: "https://i79.ai/engage",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free trial available — no credit card required",
  },
  featureList: [
    "Automated hiring pipeline",
    "CV & candidate scoring",
    "Structured AI interviews",
    "Decision packs",
    "AI sourcing & outreach",
    "Branded career page",
    "SSO authentication",
    "HRIS & ATS integrations",
    "Hiring analytics",
  ],
};

export default function EngagePage() {
  return (
    <>
      <JsonLd schema={engageSchema} />
      <EngageHero />
      <EngageDemo />
      <PipelineVisual />
      <EngageWorkflow />
      <Features />
      <AIInterview />
      <Integrations />
      <EngageCTA />
    </>
  );
}
