import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Users, Briefcase, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

const useCases = [
  {
    icon: Users,
    subtitle: "For Hiring Teams",
    title: "Hire Faster Without Increasing Team Size",
    problem: "Too many candidates to screen manually. Recruiters buried in first-round interviews.",
    benefits: [
      "Reduce screening time by up to 80%",
      "Interview hundreds of candidates simultaneously",
      "Receive decision-ready ranked shortlists",
    ],
    href: "/use-cases#hiring-teams",
    ctaLabel: "Start Free Trial",
    ctaHref: "https://vengage.i79.ai/register",
  },
  {
    icon: Briefcase,
    subtitle: "For Recruiters",
    title: "Handle High-Volume Hiring with Ease",
    problem: "High application volume, limited recruiter bandwidth, inconsistent evaluation.",
    benefits: [
      "Manage large candidate pipelines effortlessly",
      "Eliminate manual scheduling coordination",
      "Standardize evaluation across all roles",
    ],
    href: "/use-cases#recruiters",
    ctaLabel: "Try AI Interviews",
    ctaHref: "https://vengage.i79.ai/register",
  },
  {
    icon: TrendingUp,
    subtitle: "For Fast-Growing Companies",
    title: "Scale Hiring Without Slowing Down",
    problem: "Rapid hiring needs with limited HR infrastructure and pressure to maintain quality.",
    benefits: [
      "Hire faster without building large HR teams",
      "Maintain consistent standards across roles",
      "Adapt instantly to changing hiring volumes",
    ],
    href: "/use-cases#fast-growing",
    ctaLabel: "Start Hiring Faster",
    ctaHref: "https://vengage.i79.ai/register",
  },
];

export default function UseCasesStrip() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Built for your hiring challenge
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Whether you're a team of 5 or 500 — i79 Engage adapts to how you hire.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {useCases.map((uc) => {
          const Icon = uc.icon;
          return (
            <Card key={uc.title} className="flex flex-col gap-5 p-7">
              {/* Header */}
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {uc.subtitle}
                </span>
                <h3 className="mt-2 text-base font-semibold text-foreground leading-snug">
                  {uc.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {uc.problem}
                </p>
              </div>

              {/* Benefits */}
              <ul className="flex flex-col gap-2">
                {uc.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <a
                  href={uc.ctaHref}
                  className="text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  {uc.ctaLabel}
                </a>
                <Link
                  href={uc.href}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Learn more <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/use-cases"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all use cases <ArrowRight size={14} />
        </Link>
      </div>
    </SectionWrapper>
  );
}
