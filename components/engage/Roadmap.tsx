"use client";

import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Sparkles, Star, Globe, Mail, Search, Link2, FileText, Languages, UserCheck } from "lucide-react";

const roadmap = [
  {
    title: "Multi-lingual AI Interviewer",
    description: "Interview candidates in any language. Unlock global talent pools with AI that speaks their language.",
    icon: Languages,
    priority: true,
  },
  {
    title: "Advanced AI Interviewer",
    description: "AI that deeply aligns with your job description — conducts in-depth, requirement-driven interviews for any role.",
    icon: Sparkles,
    priority: true,
  },
  {
    title: "LinkedIn Integration",
    description: "Post jobs to LinkedIn with one click — reach millions instantly.",
    icon: Link2,
  },
  {
    title: "Monster.com Integration",
    description: "One-click job posting to Monster.com for maximum reach.",
    icon: Globe,
  },
  {
    title: "Add to Pipeline via Email",
    description: "Forward a CV to a unique email address to instantly add candidates to your pipeline.",
    icon: Mail,
  },
  {
    title: "Internal Talent Pool Search",
    description: "Search your own talent pool to rediscover past applicants and silver medalists.",
    icon: Search,
  },
  {
    title: "Custom Questions on Application",
    description: "Add your own questions to job applications for tailored screening.",
    icon: FileText,
  },
  {
    title: "Custom Domain for Career Pages",
    description: "Brand your career site with your own domain for a seamless candidate experience.",
    icon: Globe,
  },
  {
    title: "Verify Email Domain",
    description: "Authenticate your email domain for professional, trusted candidate communication.",
    icon: UserCheck,
  },
];

export default function Roadmap() {
  return (
    <SectionWrapper>
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Product Roadmap
        </span>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          What’s Next for i79 Engage
        </h2>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl mx-auto">
          We’re building the future of AI-powered hiring. Here’s what’s coming soon — driven by customer feedback and innovation.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {roadmap
          .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
          .map(({ title, description, icon: Icon, priority }, idx) => (
            <div
              key={title}
              className={`relative rounded-2xl border border-border bg-card p-8 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-primary/20 flex flex-col items-start gap-4 ${
                priority ? "ring-2 ring-primary/80" : ""
              }`}
            >
              <div className={`mb-2 flex items-center justify-center w-12 h-12 rounded-full ${priority ? "bg-primary text-background" : "bg-muted text-primary"}`}>
                <Icon size={28} />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-1">{title}</h3>
              <p className="text-base text-muted-foreground">{description}</p>
              {priority && (
                <span className="absolute top-4 right-4 bg-primary text-background text-xs font-bold px-3 py-1 rounded-full shadow">Top Priority</span>
              )}
            </div>
          ))}
      </div>
    </SectionWrapper>
  );
}
