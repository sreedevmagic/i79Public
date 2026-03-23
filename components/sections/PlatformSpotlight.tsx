import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Users, Bot, BarChart3 } from "lucide-react";

const highlights = [
  { icon: Bot, label: "AI Interview Automation" },
  { icon: Users, label: "Candidate Pipeline" },
  { icon: BarChart3, label: "Hiring Analytics" },
];

export default function PlatformSpotlight() {
  return (
    <SectionWrapper>
      <div className="relative rounded-3xl border border-primary/20 bg-card overflow-hidden p-10 md:p-16 glow-primary">
        {/* Background gradient */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="max-w-2xl">
          {/* Label */}
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            Featured Product
          </span>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            Meet{" "}
            <span className="gradient-text">i79 Engage</span>
          </h2>

          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            An AI-powered recruitment platform that automates interviews,
            scores candidates intelligently, and accelerates hiring decisions —
            built for modern enterprises.
          </p>

          {/* Highlights */}
          <div className="mt-8 flex flex-wrap gap-3">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-muted-foreground"
              >
                <Icon size={15} className="text-primary" />
                {label}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 flex items-center gap-4">
            <Button href="/engage" variant="primary" size="md">
              Explore Engage
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button href="https://app.i79.ai/signup" variant="outline" size="md">
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
