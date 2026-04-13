import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Starter",
    tagline: "Try before you commit",
    description: "Get your first AI interviews running immediately. No credit card required. Includes candidate processing and interview credits to evaluate the platform with real candidates.",
    features: [
      "Candidate processing credits included",
      "AI interview credits included",
      "Basic candidate pipeline",
      "Candidate scoring & AI scorecards",
      "Interview transcripts",
      "Email support",
    ],
    ctaLabel: "Start Free",
    ctaHref: "https://vengage.i79.ai/register",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Growth",
    tagline: "For scaling hiring teams",
    description: "Higher credit allowances, full pipeline, and all core AI hiring tools. Built for teams that hire consistently and need reliable throughput.",
    features: [
      "Higher candidate & interview credit limits",
      "Full candidate pipeline",
      "AI scorecards & decision packs",
      "JD generator",
      "Hiring analytics",
      "Add-on credit packs available",
      "Priority email & chat support",
    ],
    ctaLabel: "Contact for Pricing",
    ctaHref: "/contact",
    ctaVariant: "primary" as const,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    tagline: "Full platform, governed at scale",
    description: "The complete platform with enterprise-grade integrations, governance workflows, and dedicated support for complex hiring environments.",
    features: [
      "Everything in Growth & Scale",
      "AI sourcing & outreach",
      "HRIS & ATS integrations",
      "SSO & role-based access controls",
      "Requisition approval workflows",
      "Immutable audit trail",
      "Dedicated account manager",
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

export default function PricingPreview() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Start free. Scale when you&apos;re ready. Enterprise pricing on request.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
              tier.highlighted
                ? "border-primary/50 bg-card shadow-xl shadow-primary/10 glow-primary"
                : "border-border bg-card"
            }`}
          >
            {tier.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full">
                {tier.badge}
              </span>
            )}

            <div>
              <p className="text-lg font-bold text-foreground">{tier.name}</p>
              <p className="text-xs text-primary font-medium mt-0.5">{tier.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {tier.description}
              </p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Button
                href={tier.ctaHref}
                variant={tier.ctaVariant}
                size="md"
                className="w-full justify-center"
              >
                {tier.ctaLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View full pricing — including Scale plan <ArrowRight size={14} />
        </Link>
      </div>
    </SectionWrapper>
  );
}
