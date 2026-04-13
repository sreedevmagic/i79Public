import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { X, CheckCircle2 } from "lucide-react";

const contrasts = [
  {
    before: "Tracks candidates through stages",
    after: "Actively processes every candidate — scores, interviews, ranks",
  },
  {
    before: "Relies on recruiter to screen manually",
    after: "AI scores every applicant automatically on arrival",
  },
  {
    before: "Scheduling coordination for interviews",
    after: "AI conducts interviews — no scheduling, no no-shows",
  },
  {
    before: "Gut-feel decisions from interview notes",
    after: "Structured scorecards and Decision Packs per candidate",
  },
];

export default function Differentiator() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: positioning statement */}
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Why i79 Engage
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Most tools track your hiring.{" "}
            <span className="gradient-text">i79 Engage runs it.</span>
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
            ATS tools were built to organise candidates. i79 Engage was built to
            eliminate the manual work between a candidate&apos;s first application
            and your final hiring decision.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {[
              "AI sourcing finds candidates before job boards",
              "Automatic scoring the moment they apply",
              "AI interviews conducted without recruiter input",
              "Decision Packs ready for stakeholder sign-off",
            ].map((point) => (
              <div key={point} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={12} className="text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: contrast table */}
        <div className="flex flex-col gap-3">
          {/* Header row */}
          <div className="grid grid-cols-2 gap-3 mb-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50">
              <X size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Standard ATS
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <CheckCircle2 size={13} className="text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                i79 Engage
              </span>
            </div>
          </div>

          {contrasts.map(({ before, after }) => (
            <div key={before} className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-muted/30 border border-border">
                <X size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground leading-snug">
                  {before}
                </span>
              </div>
              <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-primary/5 border border-primary/20">
                <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground leading-snug font-medium">
                  {after}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
