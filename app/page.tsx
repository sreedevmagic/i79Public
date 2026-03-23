import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/sections/Hero";
import ServicesGrid from "@/components/sections/ServicesGrid";
import PlatformSpotlight from "@/components/sections/PlatformSpotlight";
import Differentiator from "@/components/sections/Differentiator";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata({
  title: "i79.ai | AI Consulting & Intelligent Systems",
  description:
    "AI consulting company building enterprise AI platforms, intelligent automation, and AI-powered recruitment systems.",
});

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
