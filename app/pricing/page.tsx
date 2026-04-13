import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import PricingHero from "@/components/pricing/PricingHero";
import PricingTiers from "@/components/pricing/PricingTiers";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "Pricing – i79 Engage AI Hiring Platform",
    description:
      "Start free with 10 AI interviews. Scale with Growth or Enterprise pricing tailored to your team. Contact us for custom pricing.",
    openGraph: {
      title: "Pricing – i79 Engage",
      description:
        "Simple, transparent pricing for AI hiring automation. Free plan available. Contact us for Growth and Enterprise pricing.",
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
        secondaryLabel="Start Free"
        secondaryHref="https://vengage.i79.ai/register"
      />
    </>
  );
}
