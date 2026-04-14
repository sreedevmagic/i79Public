"use client";

import { useState } from "react";
import Image from "next/image";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { LayoutDashboard, BarChart3, Search, FileText } from "lucide-react";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    src: "/Images/Dashboardv1.png",
    alt: "i79 Engage Dashboard — pipeline health, work queue, and decision-ready candidates",
    caption: "Real-time overview of your hiring operations — pipeline health, pending actions, and decision-ready candidates in one view.",
  },
  {
    id: "pipeline",
    label: "Hiring Pipeline",
    icon: BarChart3,
    src: "/Images/pipelinev1.png",
    alt: "i79 Engage Hiring Pipeline — candidate kanban with AI screening scores",
    caption: "Candidates move through stages automatically — AI-screened, scored, and flagged before a recruiter opens a single file.",
  },
  {
    id: "sourcing",
    label: "AI Sourcing",
    icon: Search,
    src: "/Images/AI Source result.png",
    alt: "i79 Engage AI Sourcing — matched candidates with enrichment and outreach",
    caption: "AI surfaces matching candidates from external talent pools — with enrichment and outreach built in. Available on advanced plans.",
  },
  {
    id: "scorecard",
    label: "Scorecard",
    icon: FileText,
    src: "/Images/scorecard.png",
    alt: "i79 Engage AI Scorecard — competency ratings, evidence, and hiring recommendation",
    caption: "Every AI interview produces a structured scorecard — competency ratings with evidence, an overall assessment, and a clear hiring recommendation.",
  },
];

export default function PipelineVisual() {
  const [active, setActive] = useState("dashboard");

  const activeTab = tabs.find((t) => t.id === active)!;

  return (
    <SectionWrapper>
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          See it in action
        </span>
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          The system at every stage
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Real screens from i79 Engage — this is exactly what your team sees.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted border border-border flex-wrap justify-center">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                active === id
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Screenshot */}
      <div className="max-w-5xl mx-auto">
        <div className="relative rounded-2xl border border-border overflow-hidden shadow-2xl shadow-primary/10 glow-primary">
          <Image
            key={activeTab.id}
            src={activeTab.src}
            alt={activeTab.alt}
            width={1440}
            height={900}
            className="w-full h-auto"
            priority
          />
        </div>
        {/* Caption */}
        <p className="mt-5 text-sm text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed">
          {activeTab.caption}
        </p>
      </div>
    </SectionWrapper>
  );
}
