import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";

interface CTAProps {
  heading?: string;
  subtext?: string;
  primaryLabel?: string;
  primaryHref?: string;
  primaryExternal?: boolean;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryExternal?: boolean;
}

export default function CTA({
  heading = "Let's Build Your AI System",
  subtext = "Ready to transform your organization with production-grade AI? Let's talk.",
  primaryLabel = "Talk to Us",
  primaryHref = "/contact",
  primaryExternal = false,
  secondaryLabel = "Explore Services",
  secondaryHref = "/services",
  secondaryExternal = false,
}: CTAProps) {
  return (
    <SectionWrapper className="relative overflow-hidden">
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative rounded-3xl border border-border bg-card p-12 md:p-20 text-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        />

        <h2 className="text-3xl md:text-5xl font-semibold text-foreground">
          {heading}
        </h2>
        <p className="mt-5 text-base text-muted-foreground max-w-xl mx-auto">
          {subtext}
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            href={primaryHref}
            target={primaryExternal ? "_blank" : undefined}
            rel={primaryExternal ? "noopener noreferrer" : undefined}
            variant="primary"
            size="lg"
          >
            {primaryLabel}
          </Button>
          {secondaryLabel && (
            <Button
              href={secondaryHref}
              target={secondaryExternal ? "_blank" : undefined}
              rel={secondaryExternal ? "noopener noreferrer" : undefined}
              variant="outline"
              size="lg"
            >
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}
