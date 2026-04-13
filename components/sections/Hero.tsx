import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <SectionWrapper className="relative overflow-hidden pt-36 pb-28 flex items-center justify-center min-h-screen">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="text-center max-w-4xl mx-auto animate-fade-up">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          i79 Engage — AI Hiring Platform
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-foreground">
          Run Your Hiring Pipeline{" "}
          <span className="gradient-text">Automatically</span>
        </h1>

        {/* Subtext */}
        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Source, screen, interview, and shortlist candidates — in one
          streamlined system. No coordination overhead. No manual first rounds.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="https://vengage.i79.ai/register" variant="primary" size="lg">
            Start Free Trial <ArrowRight size={16} className="ml-2" />
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            <Play size={15} className="mr-2" />
            Book a Demo
          </Button>
        </div>

        {/* Social proof strip */}
        <p className="mt-12 text-xs text-muted-foreground uppercase tracking-widest">
          Trusted by forward-thinking hiring teams
        </p>
      </div>
    </SectionWrapper>
  );
}
