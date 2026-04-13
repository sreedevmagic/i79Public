import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { CheckCircle2 } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    tagline: "Try before you commit",
    price: "Free",
    priceSub: "No credit card required",
    description:
      "Get your first AI interviews running immediately. Includes candidate processing and interview credits to evaluate the platform with real candidates.",
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
    price: "Contact for Pricing",
    priceSub: "Tailored to your hiring volume",
    description:
      "Higher credit allowances, full pipeline, and all core AI hiring tools. Built for teams that hire consistently and need reliable throughput.",
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
    name: "Scale",
    tagline: "For high-volume hiring",
    price: "Contact for Pricing",
    priceSub: "For larger teams and higher volumes",
    description:
      "Large credit pools, multi-team support, and advanced controls for organisations running high-volume or multi-location hiring.",
    features: [
      "Everything in Growth",
      "Much larger credit limits",
      "Multi-team & multi-location support",
      "Branded career page",
      "Calendar integrations",
      "Advanced hiring analytics",
      "Dedicated onboarding support",
    ],
    ctaLabel: "Contact for Pricing",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
  {
    name: "Enterprise",
    tagline: "Full platform, governed at scale",
    price: "Contact Sales",
    priceSub: "Custom contract & onboarding",
    description:
      "The complete platform with enterprise-grade integrations, governance workflows, and dedicated support for complex, regulated hiring environments.",
    features: [
      "Everything in Scale",
      "AI sourcing & outreach",
      "HRIS & ATS integrations",
      "SSO & role-based access controls",
      "Requisition approval workflows",
      "Immutable audit trail",
      "Dedicated account manager",
      "SLA & custom onboarding",
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
    highlighted: false,
  },
];

const faqs = [
  {
    q: "Is the Starter plan really free?",
    a: "Yes — no credit card required. Starter includes candidate processing and interview credits so you can run real AI interviews immediately and evaluate the platform properly.",
  },
  {
    q: "How does credit-based billing work?",
    a: "The platform uses two types of credits: Candidate Processing Credits (consumed when a candidate is scored and processed) and AI Interview Credits (consumed when an AI interview is completed). Each plan includes a credit allowance, and add-on packs are available if you need more.",
  },
  {
    q: "How is Growth or Scale pricing determined?",
    a: "Pricing is based on your team size and expected hiring volume. Contact us and we'll build a plan around your actual needs — no fixed tiers that don't fit.",
  },
  {
    q: "Can I upgrade from Starter to a paid plan at any time?",
    a: "Absolutely. Your pipeline, candidates, scorecards, and history carry over when you upgrade.",
  },
];

export default function PricingTiers() {
  return (
    <>
      {/* Tiers */}
      <section className="w-full py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
                  tier.highlighted
                    ? "border-primary/50 bg-card shadow-2xl shadow-primary/10 glow-primary"
                    : "border-border bg-card"
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                )}

                {/* Header */}
                <div>
                  <p className="text-xl font-bold text-foreground">{tier.name}</p>
                  <p className="text-xs text-primary font-medium mt-0.5">{tier.tagline}</p>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-foreground">{tier.price}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{tier.priceSub}</p>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-3">
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
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full py-20 px-6 bg-card/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="flex flex-col divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <p className="text-sm font-semibold text-foreground mb-2">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
