import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import {
  Lightbulb,
  Code2,
  Zap,
  Building2,
} from "lucide-react";

const services = [
  {
    icon: Lightbulb,
    title: "AI Strategy & Advisory",
    description:
      "Roadmaps and strategic frameworks to guide your AI transformation with clarity and confidence.",
  },
  {
    icon: Code2,
    title: "AI System Development",
    description:
      "End-to-end development of production-grade AI systems tailored to your industry and scale.",
  },
  {
    icon: Zap,
    title: "Intelligent Automation",
    description:
      "Process automation powered by AI — reducing manual effort and accelerating operations.",
  },
  {
    icon: Building2,
    title: "Enterprise Integration",
    description:
      "Seamless integration of AI capabilities into your existing enterprise stack and workflows.",
  },
];

export default function ServicesGrid() {
  return (
    <SectionWrapper className="bg-card/30">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          What We Do
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          From strategy to deployment — we deliver real AI systems, not just
          recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Card key={service.title} hover className="flex flex-col gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </Card>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
