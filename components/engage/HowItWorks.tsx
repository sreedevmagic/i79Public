import { SectionWrapper } from "@/components/ui/SectionWrapper";

const steps = [
  {
    number: "01",
    title: "Post a Job",
    description:
      "Create a role, define criteria, and let Engage configure the AI interview questions automatically.",
  },
  {
    number: "02",
    title: "Candidates Apply",
    description:
      "Applicants are invited to complete an AI-conducted interview on their own schedule — no scheduling required.",
  },
  {
    number: "03",
    title: "AI Evaluates",
    description:
      "Every response is analyzed for communication, confidence, behavioral fit, and fraud — scored in real time.",
  },
  {
    number: "04",
    title: "You Decide Faster",
    description:
      "Review ranked candidates with AI scorecards, transcripts, and insights. Cut time-to-hire by 60%.",
  },
];

export default function HowItWorks() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          How It Works
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          From job post to final decision — in days, not weeks.
        </p>
      </div>

      <div className="relative">
        {/* Connector line */}
        <div
          aria-hidden
          className="hidden md:block absolute top-9 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-24"
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, idx) => (
            <div key={step.number} className="relative flex flex-col items-center md:items-start text-center md:text-left">
              {/* Step dot */}
              <div className="relative z-10 w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-lg">
                <span className="text-lg font-bold gradient-text">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
