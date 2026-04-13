import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/sections/Hero";
import ProductTeaser from "@/components/sections/ProductTeaser";
import SocialProof from "@/components/sections/SocialProof";
import UseCasesStrip from "@/components/sections/UseCasesStrip";
import PricingPreview from "@/components/sections/PricingPreview";
import ServicesTeaser from "@/components/sections/ServicesTeaser";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "i79 Engage – AI Interview & Hiring Automation",
    description:
      "Run AI interviews at scale. Automatically screen, interview, and rank candidates using AI. Shortlist top talent in minutes with i79 Engage.",
    openGraph: {
      title: "i79 Engage – Run AI Interviews at Scale",
      description:
        "Automatically screen, interview, and rank candidates. No scheduling. No manual first rounds. Just a decision-ready shortlist.",
    },
  },
  {
    canonicalPath: "/",
    extraKeywords: [
      "AI interview automation",
      "AI hiring platform",
      "automated candidate screening",
      "AI recruitment software",
      "shortlist candidates with AI",
    ],
  }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <ProductTeaser />
      <UseCasesStrip />
      <PricingPreview />
      <ServicesTeaser />
      <CTA
        heading="Start automating your hiring pipeline"
        subtext="Set up a job, score candidates automatically, and get a ranked shortlist — all in under an hour."
        primaryLabel="Start Free Trial"
        primaryHref="https://vengage.i79.ai/register"
        secondaryLabel="Book a Demo"
        secondaryHref="/contact"
      />
    </>
  );
}
