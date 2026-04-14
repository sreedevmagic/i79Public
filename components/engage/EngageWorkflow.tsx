import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create a Job",
    description:
      "Define the role and evaluation criteria. AI suggests the job description, interview questions, and the scoring competencies that will drive the entire hiring process.",
  },
  {
    number: "02",
    title: "Candidates Apply",
    description:
      "Applicants come in via your branded career page. Every application is automatically scored against the job requirements the moment it arrives — ranked before a recruiter opens a single file.",
  },
  {
    number: "03",
    title: "AI Interview",
    description:
      "Top-ranked candidates are invited to a structured AI interview. The AI agent conducts the interview based on the role's scoring criteria — every question is purposeful, adapts in real time, and is consistent across all candidates.",
  },
  {
    number: "04",
    title: "Review Scorecards",
    description:
      "A structured scorecard is generated per candidate — competency ratings, evidence, and a hiring recommendation. Your team reviews and approves before any candidate advances. You stay in control.",
  },
  {
    number: "05",
    title: "Panel Interview",
    description:
      "Shortlisted candidates are invited to a human or panel interview. Decision Packs give every interviewer the full context — AI scorecard, candidate scores, and key insights — before they enter the room.",
  },
  {
    number: "06",
    title: "Hire",
    description:
      "Capture the final hiring decision directly in the platform. All scorecards, assessments, and decisions are stored — giving you a complete, auditable record from first application to offer.",
  },
];

export default function EngageWorkflow() {
  return (
    <SectionWrapper>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          How it works
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          From job post to final decision — in days, not weeks.
        </p>
      </div>

      <div className="relative">
        {/* Connector line — top row (desktop) */}
        <div
          aria-hidden
          className="hidden md:block absolute top-9 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-20"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center md:items-start text-center md:text-left"
            >
              {/* Step node */}
              <div className="relative z-10 w-[4.5rem] h-[4.5rem] rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-lg">
                <span className="text-lg font-bold gradient-text">{step.number}</span>
              </div>

              <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
