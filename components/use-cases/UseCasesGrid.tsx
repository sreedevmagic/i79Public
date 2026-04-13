import { Button } from "@/components/ui/Button";
import { CheckCircle2, ArrowRight } from "lucide-react";

const useCases = [
  {
    id: "hiring-teams",
    subtitle: "Hiring Teams",
    title: "Hire Faster Without Increasing Team Size",
    tagline: "Automate screening interviews and focus your team on final hiring decisions.",
    problem: {
      heading: "The problem",
      points: [
        "Too many candidates to screen manually",
        "Recruiters overloaded with first-round interviews",
        "Slow hiring cycles impacting business velocity",
      ],
    },
    solution: {
      heading: "How i79 Engage helps",
      body: "i79 Engage automates the most time-consuming part of hiring. AI conducts structured interviews, candidates are scored and ranked automatically, and hiring teams receive decision-ready shortlists — without lifting a finger.",
    },
    benefits: [
      "Reduce screening time by up to 80%",
      "Interview hundreds of candidates simultaneously",
      "Standardize evaluation across roles and teams",
      "Accelerate time-to-hire without adding headcount",
    ],
    steps: [
      "Create a job and define evaluation criteria",
      "Add candidates or upload resumes",
      "AI conducts interviews automatically",
      "Receive a ranked shortlist with AI insights",
    ],
    primaryCta: { label: "Start Free Trial", href: "https://vengage.i79.ai/register" },
    secondaryCta: { label: "Book a Demo", href: "/contact" },
  },
  {
    id: "recruiters",
    subtitle: "Recruiters & Talent Acquisition",
    title: "Handle High-Volume Hiring with Ease",
    tagline: "Screen more candidates without increasing recruiter workload.",
    problem: {
      heading: "The problem",
      points: [
        "High application volume with limited bandwidth",
        "Inconsistent candidate evaluation across recruiters",
        "Manual scheduling eating into strategic work",
      ],
    },
    solution: {
      heading: "How i79 Engage helps",
      body: "i79 Engage enables recruiters to scale efficiently. AI interviews candidates at scale, automated scoring removes manual bias, and pipeline tracking keeps everything organized — so recruiters can focus on top talent.",
    },
    benefits: [
      "Manage large candidate pipelines effortlessly",
      "Improve consistency in candidate evaluation",
      "Reduce manual interview scheduling to zero",
      "Focus recruiter time on top candidates only",
    ],
    steps: [
      "Import candidates or source using AI",
      "Launch AI interviews for all candidates",
      "Review AI-generated scores and transcripts",
      "Move top candidates forward instantly",
    ],
    primaryCta: { label: "Start Free Trial", href: "https://vengage.i79.ai/register" },
    secondaryCta: { label: "Book a Demo", href: "/contact" },
  },
  {
    id: "fast-growing",
    subtitle: "Fast-Growing Companies",
    title: "Scale Hiring Without Slowing Down",
    tagline: "Build your team quickly without compromising on quality.",
    problem: {
      heading: "The problem",
      points: [
        "Rapid hiring needs outpacing your current process",
        "Limited hiring infrastructure and HR capacity",
        "Pressure to maintain quality while moving fast",
      ],
    },
    solution: {
      heading: "How i79 Engage helps",
      body: "i79 Engage gives fast-growing companies a scalable hiring system from day one. AI handles initial screening, interviews are standardized across all roles, and real-time pipeline visibility keeps leadership aligned.",
    },
    benefits: [
      "Hire faster without building large HR teams",
      "Maintain consistent hiring standards across roles",
      "Reduce bottlenecks in the hiring process",
      "Adapt instantly to changing hiring volumes",
    ],
    steps: [
      "Set up job roles in minutes",
      "Let AI manage first-round interviews",
      "Track all candidates in a live pipeline",
      "Make faster, more confident hiring decisions",
    ],
    primaryCta: { label: "Start Hiring Faster", href: "https://vengage.i79.ai/register" },
    secondaryCta: { label: "Book a Demo", href: "/contact" },
  },
  {
    id: "distributed",
    subtitle: "Distributed & Remote Teams",
    title: "Run Interviews Anywhere, Anytime",
    tagline: "Enable seamless hiring across locations and time zones.",
    problem: {
      heading: "The problem",
      points: [
        "Scheduling interviews across multiple time zones",
        "Delays due to availability conflicts and no-shows",
        "Lack of standardized evaluation across locations",
      ],
    },
    solution: {
      heading: "How i79 Engage helps",
      body: "i79 Engage removes scheduling bottlenecks entirely. AI interviews run asynchronously — candidates complete them at their convenience — and teams review results anytime from anywhere, with no coordination overhead.",
    },
    benefits: [
      "Eliminate scheduling delays and back-and-forth",
      "Improve candidate experience with flexible timing",
      "Standardize evaluation globally across all locations",
      "Enable remote hiring at any scale",
    ],
    steps: [
      "Send interview invites to candidates globally",
      "Candidates complete interviews at their convenience",
      "AI evaluates all responses consistently",
      "Teams review insights and shortlists on their schedule",
    ],
    primaryCta: { label: "Start Free Trial", href: "https://vengage.i79.ai/register" },
    secondaryCta: { label: "Book a Demo", href: "/contact" },
  },
  {
    id: "enterprise",
    subtitle: "Enterprise Hiring Teams",
    title: "Make Structured, Data-Driven Hiring Decisions",
    tagline: "Bring consistency, insights, and governance into your hiring process.",
    problem: {
      heading: "The problem",
      points: [
        "Fragmented hiring processes across teams and regions",
        "Lack of structured evaluation and audit trails",
        "Difficulty aligning stakeholders on hiring decisions",
      ],
    },
    solution: {
      heading: "How i79 Engage helps",
      body: "i79 Engage introduces structured, governed hiring workflows for enterprise teams. Decision packs consolidate insights per candidate, AI scoring ensures consistency at scale, and approval workflows streamline multi-stakeholder sign-off.",
    },
    benefits: [
      "Improve hiring quality with standardized AI evaluation",
      "Enable data-driven decisions with full audit trails",
      "Align stakeholders with shared candidate insights",
      "Reduce hiring risk with structured governance",
    ],
    steps: [
      "Create structured job roles with AI-generated scoring criteria",
      "Score candidates automatically as they arrive",
      "Run AI interviews and generate per-candidate scorecards",
      "Review decision packs and align stakeholders — faster than ever",
    ],
    primaryCta: { label: "Book a Demo", href: "/contact" },
    secondaryCta: { label: "Contact Sales", href: "/contact" },
  },
];

export default function UseCasesGrid() {
  return (
    <div className="w-full">
      {useCases.map((uc, i) => (
        <section
          key={uc.id}
          id={uc.id}
          className={`w-full py-20 px-6 ${i % 2 === 1 ? "bg-card/20" : ""}`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              {/* Left: Problem + Solution */}
              <div>
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                  {uc.subtitle}
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight">
                  {uc.title}
                </h2>
                <p className="mt-3 text-base text-muted-foreground">{uc.tagline}</p>

                <div className="mt-8">
                  <p className="text-sm font-semibold text-foreground mb-3">{uc.problem.heading}</p>
                  <ul className="flex flex-col gap-2">
                    {uc.problem.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-destructive mt-0.5">✕</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 rounded-xl bg-primary/5 border border-primary/15 p-5">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    {uc.solution.heading}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{uc.solution.body}</p>
                </div>
              </div>

              {/* Right: Benefits + Workflow + CTAs */}
              <div className="flex flex-col gap-8">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-4">Key benefits</p>
                  <ul className="flex flex-col gap-3">
                    {uc.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-4">How it works</p>
                  <ol className="flex flex-col gap-3">
                    {uc.steps.map((step, idx) => (
                      <li key={step} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button href={uc.primaryCta.href} variant="primary" size="md">
                    {uc.primaryCta.label}
                  </Button>
                  <Button href={uc.secondaryCta.href} variant="outline" size="md">
                    {uc.secondaryCta.label} <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
