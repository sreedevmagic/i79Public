import { SectionWrapper } from "@/components/ui/SectionWrapper";

export default function PricingHero() {
  return (
    <SectionWrapper className="pt-36 pb-16 text-center">
      <div className="max-w-2xl mx-auto">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-6">
          Pricing
        </span>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
          Simple,{" "}
          <span className="gradient-text">transparent</span>
          <br />
          pricing
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
          Start free. Scale as you hire. Enterprise pricing is custom — just{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      </div>
    </SectionWrapper>
  );
}
