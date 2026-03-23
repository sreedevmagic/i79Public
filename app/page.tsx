import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/sections/Hero";
import ServicesGrid from "@/components/sections/ServicesGrid";
import PlatformSpotlight from "@/components/sections/PlatformSpotlight";
import Differentiator from "@/components/sections/Differentiator";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "i79.ai – AI Consulting & Intelligent Systems",
    description:
      "i79.ai builds enterprise AI platforms, intelligent automation, and AI-powered recruitment systems that help organizations scale smarter and make better decisions.",
    openGraph: {
      title: "i79.ai – AI Consulting & Intelligent Systems",
      description:
        "Enterprise AI platforms, intelligent automation, and AI-powered recruitment — built for real business impact.",
    },
  },
  {
    canonicalPath: "/",
    extraKeywords: ["AI product company", "enterprise AI solutions", "AI software company"],
  }
);

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesGrid />
      <PlatformSpotlight />
      <Differentiator />
      <CTA />
    </>
  );
}
