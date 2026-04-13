import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Lightbulb, Code2, Zap } from "lucide-react";

const offerings = [
  { icon: Lightbulb, label: "AI Consulting" },
  { icon: Code2, label: "Custom AI Development" },
  { icon: Zap, label: "Workflow Automation" },
];

export default function ServicesTeaser() {
  return (
    <SectionWrapper tight className="bg-card/20">
      <div className="max-w-3xl mx-auto text-center">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Services
        </span>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          Need custom AI solutions?
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          We help enterprises design and build AI systems tailored to their workflows — from
          strategy to live deployment.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {offerings.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-muted-foreground"
            >
              <Icon size={14} className="text-primary" />
              {label}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/contact" variant="outline" size="md">
            Talk to an Expert <ArrowRight size={15} className="ml-2" />
          </Button>
          <Button href="/services" variant="ghost" size="md">
            View Services
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );
}
