import { SectionWrapper } from "@/components/ui/SectionWrapper";
import { Button } from "@/components/ui/Button";
import { Play, ArrowRight, Calendar } from "lucide-react";

export default function EngageDemo() {
  return (
    <SectionWrapper className="bg-card/20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-semibold text-foreground">
          See it in action
        </h2>
        <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">
          Watch how i79 Engage runs an AI interview, scores candidates, and delivers a
          ranked shortlist — no manual input required.
        </p>
      </div>

      {/* Demo placeholder */}
      <div className="relative rounded-3xl border border-border bg-card overflow-hidden aspect-video max-w-4xl mx-auto shadow-2xl shadow-primary/10">
        {/* Mock background gradient */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card to-accent/5"
        />

        {/* Mock UI preview */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
          {/* Mock browser chrome */}
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background/60 backdrop-blur-sm p-4 opacity-60">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              <div className="ml-2 flex-1 rounded-md bg-muted h-5" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Applied (12)", "AI Interviewed (8)", "Shortlisted (3)"].map((col) => (
                <div key={col} className="rounded-lg bg-muted/60 p-2">
                  <p className="text-xs text-muted-foreground/70 mb-2">{col}</p>
                  <div className="space-y-1.5">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-8 rounded bg-border/40 flex items-center px-2 gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-primary/20 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="h-1.5 rounded bg-border/60 w-3/4" />
                          <div className="h-1 rounded bg-border/40 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Play button overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-primary/30 transition-colors group">
              <Play size={28} className="text-primary ml-1 group-hover:scale-110 transition-transform" fill="currentColor" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Product demo coming soon</p>
              <p className="text-xs text-muted-foreground mt-1">
                Book a live walkthrough with our team in the meantime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback CTA */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button href="/contact" variant="primary" size="md">
          <Calendar size={16} className="mr-2" />
          Book a Live Demo
        </Button>
        <Button href="https://vengage.i79.ai/register" variant="outline" size="md">
          Start Free Trial <ArrowRight size={15} className="ml-2" />
        </Button>
      </div>
    </SectionWrapper>
  );
}
