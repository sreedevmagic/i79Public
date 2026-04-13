import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/sections/Hero";
import Differentiator from "@/components/sections/Differentiator";
import ProductTeaser from "@/components/sections/ProductTeaser";
import SocialProof from "@/components/sections/SocialProof";
import UseCasesStrip from "@/components/sections/UseCasesStrip";
import PricingPreview from "@/components/sections/PricingPreview";
import ServicesTeaser from "@/components/sections/ServicesTeaser";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "i79 Engage – The AI Hiring Platform That Works End to End",
    description:
      "i79 Engage automates your entire hiring pipeline — candidate scoring, AI interviews, ranked shortlists, and decision-ready packs. Start free, no credit card required.",
    openGraph: {
      title: "i79 Engage – AI Hiring Platform",
      description:
        "Automate candidate screening, AI interviews, and hiring decisions. Get a ranked shortlist in hours, not weeks.",
    },
  },
  {
    canonicalPath: "/",
    extraKeywords: [
      "AI hiring platform",
      "AI hiring pipeline",
      "automated candidate screening",
      "AI recruitment software",
      "candidate scoring software",
      "hiring pipeline automation",
    ],
  }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <Differentiator />
      <ProductTeaser />
      <SocialProof />
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
