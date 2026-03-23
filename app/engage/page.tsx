import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import EngageHero from "@/components/engage/EngageHero";
import Features from "@/components/engage/Features";
import AIInterview from "@/components/engage/AIInterview";
import HowItWorks from "@/components/engage/HowItWorks";
import EngageCTA from "@/components/engage/EngageCTA";

export const metadata: Metadata = buildMetadata({
  title: "i79 Engage – AI-Powered Recruitment Platform",
  description:
    "i79 Engage is an AI recruitment platform with automated interviews, candidate scoring, ATS pipeline, and hiring analytics. Transform your hiring process.",
  openGraph: {
    title: "i79 Engage – AI-Powered Recruitment Platform",
    description:
      "Automate interviews, score candidates with AI, and hire smarter. i79 Engage is the intelligent ATS for modern enterprises.",
  },
});

export default function EngagePage() {
  return (
    <>
      <EngageHero />
      <Features />
      <AIInterview />
      <HowItWorks />
      <EngageCTA />
    </>
  );
}
