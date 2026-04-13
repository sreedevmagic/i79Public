import { SectionWrapper } from "@/components/ui/SectionWrapper";

const metrics = [
  { value: "80%", label: "Reduction in screening time" },
  { value: "3×", label: "More candidates evaluated per week" },
  { value: "2 min", label: "To post your first job and go live" },
  { value: "60%", label: "Faster time-to-hire on average" },
];

const testimonials = [
  {
    quote:
      "i79 Engage completely changed how we handle first-round screening. We went from spending 3 days on phone screens to having a ranked shortlist by morning.",
    name: "Sarah K.",
    role: "Head of Talent Acquisition",
    company: "Series B Tech Company",
  },
  {
    quote:
      "The AI interview quality is genuinely impressive. Candidates consistently rate the experience highly, and our hiring managers say the scorecards save them hours every week.",
    name: "James R.",
    role: "VP of People",
    company: "500-person Scale-up",
  },
];

export default function SocialProof() {
  return (
    <SectionWrapper>
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-20">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-2">
            <p className="text-4xl md:text-5xl font-bold gradient-text">{m.value}</p>
            <p className="text-sm text-muted-foreground leading-snug">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-6"
          >
            <p className="text-base text-muted-foreground leading-relaxed">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-auto">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {t.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.role}, {t.company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
