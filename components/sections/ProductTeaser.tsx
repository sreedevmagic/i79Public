import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Search, BarChart3, Mic, FileText, LayoutDashboard, LayoutTemplate } from "lucide-react";

const groups = [
  {
    label: "Source & Screen",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    items: [
      { icon: Search, title: "AI Sourcing & Outreach", badge: "Advanced", desc: "Surface matching candidates before they reach a job board." },
      { icon: BarChart3, title: "Candidate Scoring", desc: "Every applicant automatically scored on arrival against job criteria." },
    ],
  },
  {
    label: "Interview & Evaluate",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    items: [
      { icon: Mic, title: "AI Interviews", desc: "Role-specific AI agent interviews every candidate — no scheduling." },
      { icon: FileText, title: "Structured Scorecards", desc: "Competency ratings, evidence, and a hiring recommendation per candidate." },
    ],
  },
  {
    label: "Decide & Act",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
    items: [
      { icon: LayoutDashboard, title: "Decision Packs", desc: "One consolidated view per candidate — everything stakeholders need to decide." },
      { icon: LayoutTemplate, title: "Branded Career Page", badge: "Advanced", desc: "SEO-indexed career page live the moment you publish a role." },
    ],
  },
];

export default function ProductTeaser() {
  return (
    <SectionWrapper>
      <div className="text-center mb-14">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          i79 Engage
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Built-in intelligence{" "}
          <span className="gradient-text">across your entire hiring workflow</span>
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Every stage of hiring — source, screen, interview, evaluate, and
          decide — handled by one connected system.
        </p>
      </div>

      {/* Three group columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {groups.map(({ label, color, bg, border, items }) => (
          <div key={label} className="flex flex-col gap-4">
            {/* Group header */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${bg} border ${border} w-fit`}>
              <span className={`text-xs font-semibold uppercase tracking-widest ${color}`}>{label}</span>
            </div>
            {/* Items */}
            <div className="flex flex-col gap-3">
              {items.map(({ icon: Icon, title, badge, desc }) => (
                <div
                  key={title}
                  className="flex flex-col gap-2 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} className="text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground flex-1">{title}</p>
                    {badge && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button href="/engage" variant="primary" size="md">
          Explore the Full Platform <ArrowRight size={15} className="ml-2" />
        </Button>
        <Button href="https://vengage.i79.ai/register" variant="outline" size="md">
          Start Free Trial
        </Button>
      </div>
    </SectionWrapper>
  );
}
