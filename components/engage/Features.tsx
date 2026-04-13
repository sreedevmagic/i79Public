import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import {
  Mic,
  BarChart3,
  LayoutDashboard,
  FileText,
  Search,
  PenLine,
  FileSearch,
  LayoutTemplate,
  KeyRound,
  Database,
  BarChart2,
} from "lucide-react";

const primaryFeatures = [
  {
    icon: LayoutDashboard,
    title: "Automated Hiring Pipeline",
    description:
      "A complete hiring system from first application to final offer. Customisable stages, live score visibility, scorecard status, and team collaboration — all in one place. No coordination overhead.",
  },
  {
    icon: BarChart3,
    title: "Candidate & Interview Scoring",
    description:
      "Candidates are scored against the job requirements automatically on arrival. After each AI interview, a structured scorecard is generated per candidate — competency ratings, evidence, and a hiring recommendation ready for recruiter review.",
  },
  {
    icon: FileText,
    title: "Decision Packs",
    description:
      "Per-candidate packs consolidating candidate scores, AI interview scorecards, human assessments, and an AI-generated hiring summary. Stakeholders get everything they need to align and decide — in one view.",
  },
  {
    icon: Search,
    title: "AI Sourcing & Outreach",
    badge: "Advanced",
    description:
      "AI identifies matching candidate profiles and reaches out on your behalf — bringing qualified talent directly into your pipeline before they ever see a job board. Available on Growth plans and above.",
  },
  {
    icon: LayoutTemplate,
    title: "Branded Career Page",
    badge: "Advanced",
    description:
      "A public-facing career page for your company, live the moment you publish a role. SEO-optimised and indexed automatically. Candidates apply directly — no third-party redirects. Available on Scale plans and above.",
  },
  {
    icon: Mic,
    title: "AI Interviews",
    description:
      "An AI agent conducts first-round interviews based on role-specific scoring criteria — not a generic script. It adapts in real time and delivers a consistent, evidence-based evaluation across every candidate.",
  },
];

const secondaryFeatures = [
  { icon: PenLine, title: "JD Generator" },
  { icon: FileSearch, title: "Candidate Screening" },
  { icon: KeyRound, title: "Enterprise SSO & Access" },
  { icon: Database, title: "HRIS & ATS Integrations" },
  { icon: BarChart2, title: "Hiring Analytics" },
];

export default function Features() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Everything your hiring team needs
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
          Core AI hiring tools front and centre — with enterprise capabilities built in for
          when you need them.
        </p>
      </div>

      {/* Primary features — 3-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {primaryFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} hover className="flex flex-col gap-4 p-7">
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-primary" />
                </div>
                {feature.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-full whitespace-nowrap">
                    {feature.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Secondary features — compact strip */}
      <div className="border-t border-border pt-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 text-center">
          More capabilities included
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {secondaryFeatures.map(({ icon: Icon, title }) => (
            <div
              key={title}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm text-muted-foreground"
            >
              <Icon size={14} className="text-primary flex-shrink-0" />
              {title}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
