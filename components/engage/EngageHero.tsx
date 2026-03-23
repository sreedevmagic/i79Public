import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ArrowRight } from "lucide-react";

export default function EngageHero() {
  return (
    <SectionWrapper className="pt-36 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div className="animate-fade-up">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            i79 Engage
          </span>

          <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground">
            Transform Hiring{" "}
            <span className="gradient-text">with AI</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            i79 Engage is an AI-powered recruitment platform — a full ATS with
            automated AI interviews, intelligent candidate scoring, and
            data-driven hiring decisions.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Button
              href="https://vengage.i79.ai/register"
              variant="primary"
              size="lg"
            >
              Get Started Free
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              href="https://vengage.i79.ai"
              variant="outline"
              size="lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Right: Product UI visual */}
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/10 glow-primary">
            {/* Mock dashboard UI */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-2 text-xs text-muted-foreground">i79 Engage — Candidate Pipeline</span>
            </div>

            {/* Pipeline columns */}
            <div className="grid grid-cols-3 gap-3">
              {["Applied", "Interviewed", "Shortlisted"].map((col, i) => (
                <div key={col}>
                  <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    {col}
                  </p>
                  <div className="space-y-2">
                    {Array.from({ length: i === 0 ? 4 : i === 1 ? 3 : 2 }).map(
                      (_, j) => (
                        <div
                          key={j}
                          className="h-12 rounded-lg bg-muted border border-border flex items-center px-3 gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0" />
                          <div className="space-y-1 flex-1">
                            <div className="h-2 rounded bg-border w-3/4" />
                            <div className="h-1.5 rounded bg-border w-1/2" />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* AI score strip */}
            <div className="mt-4 rounded-xl bg-primary/5 border border-primary/15 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                AI
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">
                  AI Interview Score
                </p>
                <p className="text-xs text-muted-foreground">
                  Top candidate: 94/100
                </p>
              </div>
              <div className="ml-auto text-lg font-bold text-primary">94</div>
            </div>
          </div>

          {/* Glow behind card */}
          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-3xl bg-primary/8 blur-2xl"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
