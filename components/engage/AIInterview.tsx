import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Mic, Brain, TrendingUp, ShieldCheck } from "lucide-react";

const capabilities = [
  {
    icon: Mic,
    title: "Voice + Video Interviews",
    description:
      "AI conducts natural voice and video interviews, asking contextual follow-up questions in real time.",
  },
  {
    icon: Brain,
    title: "Behavioral Analysis",
    description:
      "Deep analysis of candidate responses to assess communication, confidence, and cultural alignment.",
  },
  {
    icon: TrendingUp,
    title: "Real-time Scoring",
    description:
      "Every candidate receives an AI-generated score with a detailed breakdown, immediately after the interview.",
  },
  {
    icon: ShieldCheck,
    title: "Fraud Detection",
    description:
      "Built-in anti-fraud measures detect impersonation, AI-generated answers, and suspicious behaviors.",
  },
];

export default function AIInterview() {
  return (
    <SectionWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left: Text */}
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-accent mb-5">
            Core USP
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
            AI Interviews That{" "}
            <span className="gradient-text">Actually Work</span>
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Our AI interviewer handles first-round screening at scale — giving
            every candidate a consistent, fair, and insightful evaluation
            without sacrificing quality.
          </p>

          <div className="mt-10 space-y-6">
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {title}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual */}
        <div className="relative">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-accent/5 glow-accent">
            {/* Mock interview UI */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
              <div className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-2 text-xs text-muted-foreground">
                AI Interview — Live Session
              </span>
            </div>

            {/* AI Avatar */}
            <div className="flex flex-col items-center py-6 border border-border rounded-xl bg-muted mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-white">AI</span>
              </div>
              <p className="text-sm font-medium text-foreground">AI Interviewer</p>
              <p className="text-xs text-muted-foreground mt-1">Active • Listening...</p>
              <div className="flex gap-1 mt-3">
                {[3, 5, 4, 7, 3, 6, 4].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-primary/60 animate-pulse"
                    style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <div className="rounded-lg bg-primary/8 border border-primary/15 px-3 py-2 text-xs text-foreground">
                <span className="text-primary font-semibold">AI: </span>
                Tell me about a time you led a high-pressure project.
              </div>
              <div className="rounded-lg bg-muted border border-border px-3 py-2 text-xs text-muted-foreground">
                <span className="text-foreground font-semibold">Candidate: </span>
                In my last role, I managed a cross-functional team...
              </div>
            </div>

            {/* Score preview */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Communication", score: 88 },
                { label: "Confidence", score: 91 },
                { label: "Role Fit", score: 85 },
              ].map(({ label, score }) => (
                <div
                  key={label}
                  className="rounded-lg bg-muted border border-border p-2 text-center"
                >
                  <p className="text-lg font-bold text-accent">{score}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            aria-hidden
            className="absolute -inset-4 -z-10 rounded-3xl bg-accent/5 blur-2xl"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
