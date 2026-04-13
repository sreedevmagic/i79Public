import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ArrowRight } from "lucide-react";

const steps = [
  { number: "01", label: "Create Job" },
  { number: "02", label: "Candidate Scoring" },
  { number: "03", label: "AI Interview" },
  { number: "04", label: "Shortlist" },
  { number: "05", label: "Human Interview*" },
  { number: "06", label: "Decision Pack" },
  { number: "07", label: "Hire" },
];

export default function WorkflowFlow() {
  return (
    <SectionWrapper tight className="bg-card/20">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
          From job post to hire — automated end-to-end
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          A single AI-powered pipeline that replaces weeks of manual coordination
        </p>
      </div>

      {/* Desktop flow */}
      <div className="hidden md:flex items-center justify-center gap-0 flex-wrap">
        {steps.map((step, i) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-2 px-3">
              <div className="w-12 h-12 rounded-2xl bg-card border border-primary/25 flex items-center justify-center shadow-md shadow-primary/5">
                <span className="text-xs font-bold gradient-text">{step.number}</span>
              </div>
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={14} className="text-muted-foreground/30 mb-7 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden flex flex-col items-center gap-3">
        {steps.map((step, i) => (
          <div key={step.number} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-primary/25 flex items-center justify-center">
                <span className="text-xs font-bold gradient-text">{step.number}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-4 bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Footnote */}
      <p className="mt-8 text-center text-xs text-muted-foreground/50">
        * Human interview is optional — recommended for senior roles or final-round decisions
      </p>
    </SectionWrapper>
  );
}
