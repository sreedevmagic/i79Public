import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import {
  Lightbulb,
  Code2,
  Zap,
  Users,
  Building2,
  Sparkles,
} from "lucide-react";

const services = [
  {
    icon: Lightbulb,
    title: "AI Strategy & Advisory",
    description:
      "Develop a clear, actionable AI roadmap. We assess your current capabilities, identify high-value opportunities, and define a phased transformation plan.",
    tags: ["Roadmapping", "Feasibility", "ROI Analysis"],
  },
  {
    icon: Code2,
    title: "AI System Development",
    description:
      "End-to-end engineering of production AI systems — from data pipelines and model training to APIs and deployment infrastructure.",
    tags: ["LLMs", "MLOps", "Custom Models"],
  },
  {
    icon: Zap,
    title: "Intelligent Automation",
    description:
      "Identify repetitive workflows and automate them with AI — dramatically reducing cost and error while freeing teams for higher-value work.",
    tags: ["Process Mining", "RPA + AI", "Workflow AI"],
  },
  {
    icon: Users,
    title: "AI for Hiring",
    description:
      "Deploy i79 Engage or build custom AI-powered hiring tools — screening, interviewing, scoring, and compliance built in.",
    tags: ["AI Screening", "ATS", "Interview AI"],
  },
  {
    icon: Building2,
    title: "Enterprise Integration",
    description:
      "Connect AI capabilities to your existing ERP, CRM, HRMS, and data platforms with minimal disruption and maximum impact.",
    tags: ["API Integration", "ERP", "Data Pipelines"],
  },
  {
    icon: Sparkles,
    title: "Custom AI Solutions",
    description:
      "Have a specific challenge or use case? We build bespoke AI solutions for unique enterprise needs — from NLP to computer vision.",
    tags: ["NLP", "Vision AI", "Generative AI"],
  },
];

export default function ServicesFullGrid() {
  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.title} hover className="flex flex-col gap-5">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={22} className="text-primary" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 mt-auto">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
