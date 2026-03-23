import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import {
  LayoutDashboard,
  ClipboardCheck,
  LayoutTemplate,
  KeyRound,
  Database,
  BarChart2,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Full-cycle ATS",
    description:
      "End-to-end applicant tracking from job post to offer letter — with customizable hiring stages, collaborative review, and real-time pipeline visibility.",
  },
  {
    icon: ClipboardCheck,
    title: "AI Scorecards",
    description:
      "Structured, role-specific scorecards auto-generated after every interview — giving hiring teams consistent, objective evaluation data instantly.",
  },
  {
    icon: LayoutTemplate,
    title: "Branded Career Page",
    description:
      "A dedicated career site reflecting your brand, culture, and open roles — no engineering required. Attract the right talent from day one.",
  },
  {
    icon: KeyRound,
    title: "Enterprise SSO & Access",
    description:
      "Single sign-on, role-based permissions, and audit logs built in. Meet enterprise security standards without compromise.",
  },
  {
    icon: Database,
    title: "HRIS & ATS Integrations",
    description:
      "Native connections to leading systems — Workday, SAP SuccessFactors, BambooHR, Greenhouse, and more. Sync data where your team already works.",
  },
  {
    icon: BarChart2,
    title: "Hiring Analytics",
    description:
      "Deep funnel metrics across every stage — drop-off rates, interview pass rates, time-to-hire, and recruiter performance — all in one dashboard.",
  },
];

export default function Features() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          One Platform. Every Hiring Need.
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
          From first application to final offer — i79 Engage gives your team the infrastructure, intelligence, and integrations to hire at enterprise scale.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} hover className="flex flex-col gap-4 p-7">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={22} className="text-primary" />
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
    </SectionWrapper>
  );
}
