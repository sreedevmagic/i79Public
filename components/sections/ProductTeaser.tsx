import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { ArrowRight, LayoutDashboard, BarChart3, FileText, Search } from "lucide-react";
import Link from "next/link";

const capabilities = [
  {
    icon: LayoutDashboard,
    label: "Automated Hiring Pipeline",
    desc: "One system from application to offer — no coordination overhead.",
  },
  {
    icon: BarChart3,
    label: "Candidate & Interview Scoring",
    desc: "Every applicant scored automatically. Structured scorecards after every AI interview.",
  },
  {
    icon: FileText,
    label: "Decision Packs",
    desc: "Consolidated candidate summaries that give stakeholders everything to decide.",
  },
  {
    icon: Search,
    label: "AI Sourcing & Outreach",
    desc: "Surface qualified talent before they reach a job board. Advanced plans.",
  },
];

export default function ProductTeaser() {
  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: text */}
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
            i79 Engage
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            One platform.{" "}
            <span className="gradient-text">Every stage of hiring.</span>
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md">
            i79 Engage handles the entire hiring lifecycle — so your team stops
            managing process and starts making decisions.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button href="/engage" variant="primary" size="md">
              Explore the Platform <ArrowRight size={15} className="ml-2" />
            </Button>
            <Button href="https://vengage.i79.ai/register" variant="outline" size="md">
              Start Free Trial
            </Button>
          </div>
        </div>

        {/* Right: capability list */}
        <div className="flex flex-col gap-4">
          {capabilities.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
          <Link
            href="/engage"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-3 transition-all duration-200 px-1 pt-1"
          >
            See all platform capabilities <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}
