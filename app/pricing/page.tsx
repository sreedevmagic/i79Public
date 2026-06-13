import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import PricingHero from "@/components/pricing/PricingHero";
import PricingTiers from "@/components/pricing/PricingTiers";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "Pricing – i79 Engage AI Hiring Platform",
    description:
      "Three plans built around your hiring volume — Starter, Growth, and Enterprise. Contact us for pricing tailored to your team.",
    openGraph: {
      title: "Pricing – i79 Engage",
      description:
        "Transparent, credit-based pricing for AI hiring automation. Starter, Growth, and Enterprise plans available. Contact us for pricing.",
    },
  },
  {
    canonicalPath: "/pricing",
    extraKeywords: [
      "AI hiring platform pricing",
      "AI interview software cost",
      "i79 Engage pricing",
      "recruitment automation pricing",
    ],
  }
);

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingTiers />
      <CTA
        heading="Not sure which plan fits?"
        subtext="Talk to our team — we'll help you find the right fit for your hiring volume and workflow."
        primaryLabel="Talk to Us"
        primaryHref="/contact"
        secondaryLabel="Book a Demo"
        secondaryHref="/contact"
      />
    </>
  );
}
