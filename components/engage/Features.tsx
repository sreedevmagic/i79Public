import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Card } from "@/components/ui/Card";
import { LayoutDashboard, Bot, Star, BarChart2 } from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "ATS & Pipeline",
    description:
      "A full-featured applicant tracking system with customizable hiring stages and real-time candidate management.",
  },
  {
    icon: Bot,
    title: "AI Interview Automation",
    description:
      "Automated voice and video interviews conducted by an AI agent — scored, transcribed, and analyzed instantly.",
  },
  {
    icon: Star,
    title: "Candidate Scoring",
    description:
      "AI-generated scores based on behavioral analysis, communication quality, and role-fit assessment.",
  },
  {
    icon: BarChart2,
    title: "Hiring Analytics",
    description:
      "Deep funnel analytics showing drop-offs, interview pass rates, time-to-hire, and team performance.",
  },
];

export default function Features() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Everything You Need to Hire Smarter
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          One platform. AI at every step.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} hover className="flex gap-5 p-7">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={24} className="text-primary" />
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
    </SectionWrapper>
  );
}
