import { SectionWrapper } from "@/components/ui/SectionWrapper";

export default function ServicesHero() {
  return (
    <SectionWrapper className="relative pt-36 pb-20 text-center overflow-hidden">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-6">
          What We Offer
        </span>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
          AI Consulting &amp;{" "}
          <span className="gradient-text">System Development</span>
        </h1>
        <p className="mt-7 text-lg text-muted-foreground leading-relaxed">
          We partner with enterprises to design, build, and deploy production-grade
          AI systems — from strategy through to live integration.
        </p>
      </div>
    </SectionWrapper>
  );
}
