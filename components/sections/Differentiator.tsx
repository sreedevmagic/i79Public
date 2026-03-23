import { SectionWrapper } from "@/components/ui/SectionWrapper";

const stats = [
  { value: "100%", label: "Production deployments" },
  { value: "0", label: "Strategy decks without delivery" },
  { value: "End-to-end", label: "Ownership model" },
];

export default function Differentiator() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-semibold text-foreground leading-tight">
          We don&apos;t just advise.{" "}
          <span className="gradient-text">We build.</span>
        </h2>
        <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
          i79 delivers real AI systems in production — not just strategy decks.
          We own the outcome from first principles to live deployment.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="space-y-2">
            <p className="text-4xl font-bold gradient-text">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
