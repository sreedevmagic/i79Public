import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { CalendarDays, CheckCircle2 } from "lucide-react";

const integrations = [
  {
    name: "Google Calendar",
    description: "Sync interview slots and hiring events directly to Google Calendar.",
    icon: "G",
    color: "bg-blue-500/10 text-blue-400",
  },
  {
    name: "Microsoft Outlook",
    description: "Connect Outlook to coordinate interviews and follow-ups automatically.",
    icon: "O",
    color: "bg-sky-500/10 text-sky-400",
  },
];

const comingSoon = ["Workday", "BambooHR", "Greenhouse", "Slack", "SAP SuccessFactors"];

export default function Integrations() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          Works with your tools
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Connect i79 Engage to the systems your team already uses — with more integrations on
          the way.
        </p>
      </div>

      {/* Live integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="flex items-start gap-4 bg-card border border-border rounded-2xl p-6"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${integration.color}`}
            >
              {integration.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-foreground">{integration.name}</p>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Available
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {integration.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coming soon */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          More integrations coming soon
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {comingSoon.map((name) => (
            <span
              key={name}
              className="px-3 py-1.5 rounded-full border border-border bg-muted text-xs text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
