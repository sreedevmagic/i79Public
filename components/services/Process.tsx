import { SectionWrapper } from "@/components/ui/SectionWrapper";

const steps = [
  {
    number: "01",
    title: "Discover",
    description:
      "We immerse ourselves in your business context, pain points, data landscape, and strategic goals to identify the right AI opportunity.",
  },
  {
    number: "02",
    title: "Design",
    description:
      "Architect the AI system with the right models, data flows, and integrations. Define KPIs and success criteria before a single line of code.",
  },
  {
    number: "03",
    title: "Build",
    description:
      "Engineering-led delivery using agile sprints. We build, test, and iterate quickly — with full transparency at every step.",
  },
  {
    number: "04",
    title: "Scale",
    description:
      "Deploy to production, monitor performance, and scale confidently. Ongoing support and optimization to maximize AI ROI.",
  },
];

export default function Process() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Our Process
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          A structured, transparent approach — from discovery to production.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="relative bg-card rounded-2xl border border-border p-7 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5"
          >
            {/* Number */}
            <p className="text-4xl font-bold gradient-text mb-5">
              {step.number}
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
