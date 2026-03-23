import { Button } from "@/components/ui/Button";
import { SectionWrapper } from "@/components/ui/SectionWrapper";

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
          AI Consulting &amp; Product Company
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight text-foreground">
          AI Transformation.{" "}
          <span className="gradient-text">Built for Real</span>
          <br />
          Business Impact.
        </h1>

        {/* Subtext */}
        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We design and deploy AI-powered enterprise systems and intelligent
          automation platforms that help organizations scale faster and make
          better decisions.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/contact" variant="primary" size="lg">
            Talk to Us
          </Button>
          <Button href="/engage" variant="outline" size="lg">
            Explore Engage
          </Button>
        </div>

        {/* Social proof strip */}
        <p className="mt-12 text-xs text-muted-foreground uppercase tracking-widest">
          Trusted by forward-thinking organizations
        </p>
      </div>
    </SectionWrapper>
  );
}
