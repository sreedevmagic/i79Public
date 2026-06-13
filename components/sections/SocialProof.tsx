import { SectionWrapper } from "@/components/ui/SectionWrapper";

const metrics = [
  { value: "80%", label: "Reduction in screening time" },
  { value: "3×", label: "More candidates evaluated per week" },
  { value: "2 min", label: "To post your first job and go live" },
  { value: "60%", label: "Faster time-to-hire on average" },
];

export default function SocialProof() {
  return (
    <SectionWrapper>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-8">
        {metrics.map((m) => (
          <dl key={m.label} className="space-y-2">
            <dt className="text-4xl md:text-5xl font-bold gradient-text">{m.value}</dt>
            <dd className="text-sm text-muted-foreground leading-snug">{m.label}</dd>
          </dl>
        ))}
      </div>

      {/* Metrics Disclaimer */}
      <p className="text-center text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        * Figures are based on early customer feedback and internal product testing. Results may vary based on team size, hiring volume, and role complexity.
      </p>
    </SectionWrapper>
  );
}
