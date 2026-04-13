import { SectionWrapper } from "@/components/ui/SectionWrapper";

export default function UseCasesHero() {
  return (
    <SectionWrapper className="pt-36 pb-16 text-center">
      <div className="max-w-2xl mx-auto">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-6">
          Use Cases
        </span>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
          Built for your{" "}
          <span className="gradient-text">hiring challenge</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Whether you&apos;re screening 10 candidates or 10,000 — i79 Engage adapts to how
          your team hires.
        </p>
      </div>
    </SectionWrapper>
  );
}
