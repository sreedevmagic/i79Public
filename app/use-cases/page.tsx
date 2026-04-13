import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import UseCasesHero from "@/components/use-cases/UseCasesHero";
import UseCasesGrid from "@/components/use-cases/UseCasesGrid";
import CTA from "@/components/sections/CTA";

export const metadata: Metadata = buildMetadata(
  {
    title: "Use Cases – i79 Engage AI Hiring",
    description:
      "Discover how hiring teams, recruiters, fast-growing companies, and enterprise organizations use i79 Engage to automate interviews and hire smarter.",
    openGraph: {
      title: "Use Cases – i79 Engage",
      description:
        "See how different teams use i79 Engage AI interviews to reduce screening time, handle high volume, and make faster hiring decisions.",
    },
  },
  {
    canonicalPath: "/use-cases",
    extraKeywords: [
      "AI hiring use cases",
      "recruitment automation for hiring teams",
      "AI interviews for recruiters",
      "enterprise hiring automation",
    ],
  }
);

export default function UseCasesPage() {
  return (
    <>
      <UseCasesHero />
      <UseCasesGrid />
      <CTA
        heading="Start automating your hiring pipeline"
        subtext="Join teams that have transformed their screening, interviewing, and decision-making process with i79 Engage."
        primaryLabel="Start Free Trial"
        primaryHref="https://vengage.i79.ai/register"
        secondaryLabel="Book Demo"
        secondaryHref="/contact"
      />
    </>
  );
}
