import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BarChart3, LayoutDashboard, FileText, Search, ArrowRight } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Automated Hiring Pipeline",
    description:
      "A complete hiring system from first application to final offer. Every candidate is scored, interviewed, assessed, and tracked through a single pipeline — with no manual coordination between steps.",
  },
  {
    icon: BarChart3,
    title: "Candidate & Interview Scoring",
    description:
      "Every candidate is automatically scored against the job requirements on arrival. After each AI interview, a structured scorecard is generated — competency ratings, evidence, and a hiring recommendation. Ranked shortlists build themselves.",
  },
  {
    icon: FileText,
    title: "Decision Packs",
    description:
      "Executive-ready summaries consolidating candidate scores, AI interview scorecards, human assessments, and an AI-generated hiring summary per candidate — so stakeholders can align and decide with confidence.",
  },
  {
    icon: Search,
    title: "AI Sourcing & Outreach",
    badge: "Advanced",
    description:
      "Don\u2019t wait for candidates to apply. AI identifies matching profiles and reaches out on your behalf — bringing qualified talent directly into your pipeline. Available on Growth plans and above.",
  },
];

export default function CoreFeatures() {
  return (
    <SectionWrapper>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Everything you need to screen and hire faster
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
          The core of i79 Engage — built to automate the most time-consuming parts of hiring.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {features.map((feature) => {
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
                <h3 className="text-lg font-semibold text-foreground mb-2">
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

      <div className="mt-10 text-center">
        <Button href="/engage" variant="outline" size="md">
          See all features <ArrowRight size={15} className="ml-2" />
        </Button>
      </div>
    </SectionWrapper>
  );
}
