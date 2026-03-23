import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import ServicesHero from "@/components/services/ServicesHero";
import ServicesFullGrid from "@/components/services/ServicesFullGrid";
import Process from "@/components/services/Process";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata({
  title: "AI Consulting Services – i79.ai",
  description:
    "AI strategy, system development, intelligent automation, and enterprise integration. i79.ai delivers end-to-end AI consulting and production AI systems.",
  openGraph: {
    title: "AI Consulting Services – i79.ai",
    description:
      "From AI strategy to live deployment. i79.ai builds production-grade AI systems for enterprise.",
  },
});

export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <ServicesFullGrid />
      <Process />
      <CTA
        heading="Ready to Build Your AI System?"
        subtext="Let's map out your AI transformation together — from strategy to live deployment."
        primaryLabel="Talk to Us"
        primaryHref="/contact"
        secondaryLabel="View Engage"
        secondaryHref="/engage"
      />
    </>
  );
}
