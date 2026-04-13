"use client";

import { useState } from "react";
import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { BarChart3, Mic, FileText, CheckCircle2 } from "lucide-react";

const tabs = [
  { id: "pipeline", label: "Hiring Pipeline", icon: BarChart3 },
  { id: "interview", label: "AI Interview", icon: Mic },
  { id: "scorecard", label: "Scorecard", icon: FileText },
];

// ─── Panel: Hiring Pipeline ────────────────────────────────────────────────
const candidates = [
  { initials: "AK", name: "Alex Kim", role: "Sr. Engineer", score: 91, stage: "Shortlisted", scoreColor: "text-green-400" },
  { initials: "MB", name: "Maria B.", role: "Sr. Engineer", score: 87, stage: "Shortlisted", scoreColor: "text-green-400" },
  { initials: "JP", name: "James P.", role: "Sr. Engineer", score: 74, stage: "Interviewed", scoreColor: "text-yellow-400" },
  { initials: "SC", name: "Sara C.", role: "Sr. Engineer", score: 68, stage: "Interviewed", scoreColor: "text-yellow-400" },
  { initials: "TN", name: "Tom N.", role: "Sr. Engineer", score: 43, stage: "Screening", scoreColor: "text-muted-foreground" },
];

function PipelinePanel() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
      {/* Window chrome */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
          <div className="w-3 h-3 rounded-full bg-green-400/50" />
          <span className="ml-3 text-xs text-muted-foreground font-medium">i79 Engage — Senior Engineer · 47 applicants</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Sorted by AI Score</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-border">
        {["Candidate", "AI Score", "Stage", "Status"].map((h) => (
          <span key={h} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {candidates.map((c) => (
          <div key={c.initials} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary">{c.initials}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${c.scoreColor}`}>{c.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <span className="text-xs text-muted-foreground">{c.stage}</span>
            <div>
              {c.score >= 80 ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">
                  <CheckCircle2 size={10} /> Recommended
                </span>
              ) : c.score >= 65 ? (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Review</span>
              ) : (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Processing</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">42 more candidates scored automatically</span>
        <span className="text-xs font-medium text-primary cursor-pointer hover:underline">View all →</span>
      </div>
    </div>
  );
}

// ─── Panel: AI Interview ───────────────────────────────────────────────────
const interviewMessages = [
  { role: "ai", text: "Thanks for joining, Alex. I'd like to start with a scenario from your recent work. Can you walk me through a time you had to debug a critical production issue under time pressure?" },
  { role: "candidate", text: "Sure — at my last company we had a memory leak that was taking down our API every 6 hours. I led the investigation, isolated it to a third-party library, and shipped a fix within 4 hours." },
  { role: "ai", text: "That's a strong example. How did you communicate the risk and timeline to stakeholders while the investigation was still ongoing?" },
];

const liveScores = [
  { label: "Technical Depth", score: 4, max: 5 },
  { label: "Problem Solving", score: 4, max: 5 },
  { label: "Communication", score: 3, max: 5 },
  { label: "Leadership", score: 3, max: 5 },
];

function InterviewPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
        <div className="w-3 h-3 rounded-full bg-red-400/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
        <div className="w-3 h-3 rounded-full bg-green-400/50" />
        <span className="ml-3 text-xs text-muted-foreground font-medium">AI Interview — Alex Kim · Senior Engineer · Question 3 of 6</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_220px]">
        {/* Chat area */}
        <div className="p-5 flex flex-col gap-4 border-r border-border">
          {interviewMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "candidate" ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.role === "ai" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {msg.role === "ai" ? "AI" : "A"}
              </div>
              <div className={`max-w-[80%] text-sm leading-relaxed px-4 py-3 rounded-2xl ${msg.role === "ai" ? "bg-muted/40 text-foreground rounded-tl-sm" : "bg-primary/10 text-foreground border border-primary/20 rounded-tr-sm"}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {/* Typing indicator */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted-foreground">A</div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/20 border border-border flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: "0ms"}} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: "150ms"}} />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{animationDelay: "300ms"}} />
            </div>
          </div>
        </div>

        {/* Live scores sidebar */}
        <div className="p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Scoring</p>
          <div className="flex flex-col gap-4">
            {liveScores.map(({ label, score, max }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{score}/{max}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(score / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Overall so far</p>
            <p className="text-2xl font-bold gradient-text">87<span className="text-sm font-normal text-muted-foreground">/100</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Scorecard ─────────────────────────────────────────────────────
const competencies = [
  { name: "Technical Depth", rating: 4, evidence: "Demonstrated strong debugging methodology. Isolated root cause in under 2 hours." },
  { name: "Problem Solving", rating: 4, evidence: "Structured approach to ambiguous production failure. Clear prioritisation under pressure." },
  { name: "Communication", rating: 3, evidence: "Clear with technical peers. Stakeholder communication could be more proactive." },
  { name: "Leadership", rating: 3, evidence: "Led investigation effectively. Less evidence of cross-functional alignment." },
];

const ratingLabels = ["", "Weak", "Below Avg", "Meets Bar", "Strong", "Exceptional"];

function ScorecardPanel() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-primary/5">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/30">
        <div className="w-3 h-3 rounded-full bg-red-400/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-400/50" />
        <div className="w-3 h-3 rounded-full bg-green-400/50" />
        <span className="ml-3 text-xs text-muted-foreground font-medium">AI Scorecard — Alex Kim · Senior Engineer</span>
        <div className="ml-auto">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Hire Recommended</span>
        </div>
      </div>

      {/* Header summary */}
      <div className="grid grid-cols-3 gap-px bg-border">
        {[{ label: "Overall Score", value: "87 / 100" }, { label: "AI Recommendation", value: "Hire" }, { label: "Interview Duration", value: "22 min" }].map(({ label, value }) => (
          <div key={label} className="bg-card px-5 py-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-base font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Competencies */}
      <div className="p-5 flex flex-col gap-4">
        {competencies.map(({ name, rating, evidence }) => (
          <div key={name} className="flex flex-col gap-2 p-4 rounded-xl bg-muted/20 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">{name}</span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-sm ${i < rating ? "bg-primary" : "bg-muted border border-border"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-primary font-medium ml-1">{ratingLabels[rating]}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{evidence}</p>
          </div>
        ))}
      </div>

      {/* Pending recruiter action */}
      <div className="px-5 pb-5">
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div>
            <p className="text-sm font-semibold text-foreground">Awaiting recruiter approval</p>
            <p className="text-xs text-muted-foreground mt-0.5">Approve scorecard to move Alex to shortlist</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function PipelineVisual() {
  const [active, setActive] = useState<"pipeline" | "interview" | "scorecard">("pipeline");

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
          From a ranked candidate list to a completed scorecard — this is what
          your team actually sees.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted border border-border">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id as typeof active)}
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

      {/* Panel */}
      <div className="max-w-5xl mx-auto">
        {active === "pipeline" && <PipelinePanel />}
        {active === "interview" && <InterviewPanel />}
        {active === "scorecard" && <ScorecardPanel />}
      </div>
    </SectionWrapper>
  );
}
